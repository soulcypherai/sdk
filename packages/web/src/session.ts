/**
 * Avatar Session Management with LiveKit Integration
 */

import {
  Room,
  RemoteVideoTrack,
  RemoteAudioTrack,
  RoomEvent,
  RemoteTrackPublication,
} from "livekit-client";
import {
  AvatarSession,
  SessionEventData,
  ConnectionError,
  SessionError,
} from "./types";
import {
  SESSION_EVENTS,
  AVATAR_EVENTS,
  CONNECTION_EVENTS,
  SESSION_STATUS,
  MESSAGE_TYPES,
} from "./constants";

export class AvatarSessionManager {
  room: Room | null = null;
  session: AvatarSession;
  eventHandlers: Map<string, Function[]> = new Map();

  constructor(session: AvatarSession) {
    this.session = session;
  }

  /**
   * Connect to the avatar session using LiveKit
   */
  async connect(
    videoElement?: HTMLVideoElement,
    audioElement?: HTMLAudioElement
  ): Promise<void> {
    if (!this.session.liveKitToken || !this.session.liveKitUrl) {
      throw new ConnectionError("LiveKit connection details not available");
    }

    try {
      this.room = new Room();
      this.setupRoomEventHandlers();

      await this.room.connect(
        this.session.liveKitUrl,
        this.session.liveKitToken
      );

      // Handle media elements
      if (videoElement || audioElement) {
        this.setupMediaElements(videoElement, audioElement);
      }

      this.emitEvent(SESSION_EVENTS.STARTED, { session: this.session });
    } catch (error) {
      throw new ConnectionError(
        `Failed to connect to LiveKit: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Disconnect from the avatar session
   */
  async disconnect(): Promise<void> {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    this.emitEvent(SESSION_EVENTS.ENDED, { session: this.session });
  }

  /**
   * Send a message to the avatar
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.room) {
      throw new SessionError("Not connected to session");
    }

    try {
      await this.room.localParticipant.publishData(
        new TextEncoder().encode(
          JSON.stringify({
            type: MESSAGE_TYPES.CHAT,
            text: message,
          })
        ),
        { reliable: true }
      );
    } catch (error) {
      throw new SessionError(
        `Failed to send message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get current session status
   */
  getStatus(): "connected" | "connecting" | "disconnected" | "error" {
    if (!this.room) return "disconnected";

    switch (this.room.state) {
      case "connected":
        return "connected";
      case "connecting":
        return "connecting";
      case "disconnected":
        return "disconnected";
      default:
        return "error";
    }
  }

  /**
   * Add event listener
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private setupRoomEventHandlers(): void {
    if (!this.room) return;

    this.room.on(
      RoomEvent.TrackSubscribed,
      (track, publication, participant) => {
        if (track.kind === "video") {
          this.emitEvent(AVATAR_EVENTS.VIDEO, { track, participant });
        } else if (track.kind === "audio") {
          this.emitEvent(AVATAR_EVENTS.AUDIO, { track, participant });
        }
      }
    );

    this.room.on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));

        if (data.type === MESSAGE_TYPES.STATUS) {
          this.emitEvent(AVATAR_EVENTS.STATUS, {
            status: data.status,
            text: data.text,
            participant,
          });
        } else if (data.type === MESSAGE_TYPES.RESPONSE) {
          this.emitEvent(AVATAR_EVENTS.RESPONSE, {
            text: data.text,
            participant,
          });
        } else if (data.type === MESSAGE_TYPES.ERROR) {
          this.emitEvent(AVATAR_EVENTS.ERROR, {
            text: data.text,
            participant,
          });
        }
      } catch (error) {
        console.warn("Failed to parse avatar message:", error);
      }
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.emitEvent(SESSION_EVENTS.ENDED, { session: this.session });
    });

    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      this.emitEvent(CONNECTION_EVENTS.QUALITY, { quality, participant });
    });
  }

  private setupMediaElements(
    videoElement?: HTMLVideoElement,
    audioElement?: HTMLAudioElement
  ): void {
    if (!this.room) return;

    this.room.on(
      RoomEvent.TrackSubscribed,
      (track, publication, participant) => {
        if (track instanceof RemoteVideoTrack && videoElement) {
          track.attach(videoElement);
        } else if (track instanceof RemoteAudioTrack && audioElement) {
          track.attach(audioElement);
        }
      }
    );

    this.room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach();
    });
  }

  private emitEvent(type: string, data: any): void {
    const handlers = this.eventHandlers.get(type);
    if (handlers) {
      const eventData: SessionEventData = {
        type: type as any,
        session: this.session,
        timestamp: new Date().toISOString(),
        data,
      };

      handlers.forEach((handler) => {
        try {
          handler(eventData);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }
  }
}
