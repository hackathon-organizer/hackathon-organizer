export interface Tag {
  readonly id: number;
  readonly name: string;
  isSelected: boolean;
}

export interface TeamRequest {
   ownerId: number;
   hackathonId: number;
   name: string;
   description: string;
   tags: Tag[];
}

export interface TeamResponsePage {
  content: TeamResponse[];
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface TeamResponse {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  isOpen: boolean;
  teamChatRoomId: number;
  tags: Tag[];
}

export interface TeamInvitationRequest {
  id: number;
  fromUserName: string;
  invitationStatus: string;
  teamName: string;
  teamId: number;
}
