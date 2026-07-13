import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canManageTeamScrims } from "@/lib/scrim-permissions";
import type { ScrimChatMessage, ScrimConversationSummary } from "@/lib/types";

type TeamLabel = {
  id: string;
  name: string;
  tag: string;
};

type ConversationContext = {
  id: string;
  title: string;
  subtitle: string;
  teams: TeamLabel[];
  teamIds: string[];
  manageableTeamIds: string[];
};

const MESSAGE_SELECT = {
  id: true,
  senderUserId: true,
  senderTeamId: true,
  body: true,
  createdAt: true,
  senderUser: {
    select: {
      profileName: true,
    },
  },
  senderTeam: {
    select: {
      name: true,
    },
  },
} as const;

function mapMessage(message: {
  id: string;
  senderUserId: string;
  senderTeamId: string;
  body: string;
  createdAt: Date;
  senderUser: { profileName: string };
  senderTeam: { name: string };
}): ScrimChatMessage {
  return {
    id: message.id,
    senderUserId: message.senderUserId,
    senderName: message.senderUser.profileName,
    senderTeamId: message.senderTeamId,
    senderTeamName: message.senderTeam.name,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
  };
}

function formatChatTime(startTime: Date, endTime: Date) {
  return `${startTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} - ${endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

async function getManageableTeamIds(userId: string, teamIds: string[]) {
  const uniqueTeamIds = [...new Set(teamIds)];
  const checks = await Promise.all(
    uniqueTeamIds.map(async (teamId) => ({
      teamId,
      canManage: await canManageTeamScrims(userId, teamId),
    })),
  );

  return checks.filter((check) => check.canManage).map((check) => check.teamId);
}

async function summarizeConversation(context: ConversationContext): Promise<ScrimConversationSummary> {
  const messages = await prisma.scrimMessage.findMany({
    where: { conversationId: context.id },
    select: MESSAGE_SELECT,
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return {
    id: context.id,
    title: context.title,
    subtitle: context.subtitle,
    teams: context.teams,
    manageableTeamIds: context.manageableTeamIds,
    messages: messages.map(mapMessage),
  };
}

async function createConversation(data: Prisma.ScrimConversationCreateInput) {
  try {
    return await prisma.scrimConversation.create({
      data,
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return null;
    }

    throw error;
  }
}

export async function resolveRequestConversation(requestId: string, userId: string) {
  const scrimRequest = await prisma.scrimBookingRequest.findUnique({
    where: { id: requestId },
    include: {
      availabilityBlock: {
        select: {
          startTime: true,
          endTime: true,
        },
      },
      requestingTeam: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      receivingTeam: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      conversation: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!scrimRequest) {
    return null;
  }

  const teams = [scrimRequest.receivingTeam, scrimRequest.requestingTeam];
  const teamIds = teams.map((team) => team.id);
  const manageableTeamIds = await getManageableTeamIds(userId, teamIds);

  if (manageableTeamIds.length === 0) {
    return "FORBIDDEN" as const;
  }

  let conversationId = scrimRequest.conversation?.id;

  if (!conversationId) {
    const conversation = await createConversation({
      bookingRequest: {
        connect: { id: scrimRequest.id },
      },
    });

    conversationId =
      conversation?.id ??
      (
        await prisma.scrimConversation.findUnique({
          where: { bookingRequestId: scrimRequest.id },
          select: { id: true },
        })
      )?.id;
  }

  if (!conversationId) {
    return null;
  }

  return summarizeConversation({
    id: conversationId,
    title: `${scrimRequest.receivingTeam.name} vs ${scrimRequest.requestingTeam.name}`,
    subtitle: `Scrim request, ${formatChatTime(
      scrimRequest.availabilityBlock.startTime,
      scrimRequest.availabilityBlock.endTime,
    )}`,
    teams,
    teamIds,
    manageableTeamIds,
  });
}

export async function resolveScrimConversation(scrimId: string, userId: string) {
  const scrim = await prisma.scrim.findUnique({
    where: { id: scrimId },
    include: {
      teamA: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      teamB: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      conversation: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!scrim) {
    return null;
  }

  const teams = [scrim.teamA, scrim.teamB];
  const teamIds = teams.map((team) => team.id);
  const manageableTeamIds = await getManageableTeamIds(userId, teamIds);

  if (manageableTeamIds.length === 0) {
    return "FORBIDDEN" as const;
  }

  let conversationId = scrim.conversation?.id;

  if (!conversationId) {
    const acceptedRequest = await prisma.scrimBookingRequest.findFirst({
      where: {
        availabilityBlockId: scrim.availabilityBlockId,
        status: "ACCEPTED",
      },
      include: {
        conversation: {
          select: {
            id: true,
            scrimId: true,
          },
        },
      },
    });

    if (acceptedRequest?.conversation) {
      const conversation = acceptedRequest.conversation.scrimId
        ? acceptedRequest.conversation
        : await prisma.scrimConversation.update({
            where: { id: acceptedRequest.conversation.id },
            data: { scrimId: scrim.id },
            select: { id: true },
          });
      conversationId = conversation.id;
    } else {
      const conversation = await createConversation({
        scrim: {
          connect: { id: scrim.id },
        },
        bookingRequest: acceptedRequest
          ? {
              connect: { id: acceptedRequest.id },
            }
          : undefined,
      });

      conversationId =
        conversation?.id ??
        (
          await prisma.scrimConversation.findUnique({
            where: { scrimId: scrim.id },
            select: { id: true },
          })
        )?.id;
    }
  }

  if (!conversationId) {
    return null;
  }

  return summarizeConversation({
    id: conversationId,
    title: `${scrim.teamA.name} vs ${scrim.teamB.name}`,
    subtitle: `Confirmed scrim, ${formatChatTime(scrim.startTime, scrim.endTime)}`,
    teams,
    teamIds,
    manageableTeamIds,
  });
}

export async function getConversationContext(conversationId: string, userId: string) {
  const conversation = await prisma.scrimConversation.findUnique({
    where: { id: conversationId },
    include: {
      bookingRequest: {
        include: {
          availabilityBlock: {
            select: {
              startTime: true,
              endTime: true,
            },
          },
          requestingTeam: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
          receivingTeam: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
        },
      },
      scrim: {
        include: {
          teamA: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
          teamB: {
            select: {
              id: true,
              name: true,
              tag: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return null;
  }

  const teams = conversation.scrim
    ? [conversation.scrim.teamA, conversation.scrim.teamB]
    : conversation.bookingRequest
      ? [conversation.bookingRequest.receivingTeam, conversation.bookingRequest.requestingTeam]
      : [];
  const teamIds = teams.map((team) => team.id);
  const manageableTeamIds = await getManageableTeamIds(userId, teamIds);

  if (manageableTeamIds.length === 0) {
    return "FORBIDDEN" as const;
  }

  const title = conversation.scrim
    ? `${conversation.scrim.teamA.name} vs ${conversation.scrim.teamB.name}`
    : conversation.bookingRequest
      ? `${conversation.bookingRequest.receivingTeam.name} vs ${conversation.bookingRequest.requestingTeam.name}`
      : "Scrim chat";
  const subtitle = conversation.scrim
    ? `Confirmed scrim, ${formatChatTime(conversation.scrim.startTime, conversation.scrim.endTime)}`
    : conversation.bookingRequest
      ? `Scrim request, ${formatChatTime(
          conversation.bookingRequest.availabilityBlock.startTime,
          conversation.bookingRequest.availabilityBlock.endTime,
        )}`
      : "Team coordination";

  return {
    id: conversation.id,
    title,
    subtitle,
    teams,
    teamIds,
    manageableTeamIds,
  };
}

export async function createScrimMessage({
  conversationId,
  userId,
  body,
  senderTeamId,
}: {
  conversationId: string;
  userId: string;
  body: string;
  senderTeamId?: string;
}) {
  const context = await getConversationContext(conversationId, userId);

  if (!context || context === "FORBIDDEN") {
    return context;
  }

  const selectedTeamId =
    senderTeamId && context.manageableTeamIds.includes(senderTeamId)
      ? senderTeamId
      : context.manageableTeamIds[0];
  const cleanBody = body.trim();

  if (!selectedTeamId || cleanBody.length === 0) {
    return null;
  }

  const message = await prisma.scrimMessage.create({
    data: {
      conversationId,
      senderUserId: userId,
      senderTeamId: selectedTeamId,
      body: cleanBody,
    },
    select: MESSAGE_SELECT,
  });
  const notifiedTeamIds = context.teamIds.filter((teamId) => teamId !== selectedTeamId);

  if (notifiedTeamIds.length > 0) {
    const managers = await prisma.teamMembership.findMany({
      where: {
        teamId: { in: notifiedTeamIds },
        role: { in: ["OWNER", "MANAGER", "CAPTAIN"] },
        userId: { not: userId },
      },
      select: { userId: true },
    });
    const uniqueUserIds = [...new Set(managers.map((manager) => manager.userId))];

    if (uniqueUserIds.length > 0) {
      const senderTeam = context.teams.find((team) => team.id === selectedTeamId);

      await prisma.notification.createMany({
        data: uniqueUserIds.map((recipientUserId) => ({
          userId: recipientUserId,
          type: "SCRIM_CHAT",
          title: "New scrim chat message",
          body: `${senderTeam?.name ?? "A team"} sent a message in ${context.title}.`,
          relatedEntityId: conversationId,
        })),
      });
    }
  }

  return mapMessage(message);
}

export async function markConversationChatNotificationsRead(conversationId: string, userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      type: "SCRIM_CHAT",
      relatedEntityId: conversationId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

export async function listConversationMessages({
  conversationId,
  after,
}: {
  conversationId: string;
  after?: Date;
}) {
  const messages = await prisma.scrimMessage.findMany({
    where: {
      conversationId,
      createdAt: after ? { gt: after } : undefined,
    },
    select: MESSAGE_SELECT,
    orderBy: { createdAt: "asc" },
    take: after ? 100 : 100,
  });

  return messages.map(mapMessage);
}
