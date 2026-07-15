export type VibeTag =
  | "here-for-headliners"
  | "discover-new-artists"
  | "dance-all-night"
  | "chill-vibes"
  | "front-row-energy"
  | "festival-foodie"
  | "photographer"
  | "first-timer";

export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

export interface User {
  id: string;
  email: string;
  name: string | null;
  photo_url: string | null;
  vibe_tags: VibeTag[];
  group_size_preference: number | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  snapchat_handle: string | null;
  age: number | null;
  bio: string | null;
  gender: Gender | null;
  profile_complete: boolean;
  created_at: string;
}

export interface Operator {
  id: string;
  name: string;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  slug: string;
  festival_name: string;
  operator_id: string;
  event_date: string | null;
  created_at: string;
}

export interface VerifiedBadge {
  id: string;
  user_id: string;
  event_id: string;
  verified_at: string;
  event?: Event;
}

export type GroupStatus = "open" | "confirmed";
export type MemberStatus = "pending" | "confirmed";

export interface Group {
  id: string;
  event_id: string;
  name: string | null;
  status: GroupStatus;
  created_by: string;
  max_size: number;
  created_at: string;
  members?: GroupMember[];
  event?: Event;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  status: MemberStatus;
  joined_at: string;
  user?: User;
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Pick<User, "id" | "name" | "photo_url">;
}

export interface VerifyTokenPayload {
  email: string;
  event_id: string;
  iat: number;
  exp: number;
}

export type SocialPlatform = "instagram" | "tiktok" | "snapchat";

export interface AttendeeCard {
  user: User;
  badge: VerifiedBadge;
  group?: Group | null;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string | null;
  created_at: string;
}
