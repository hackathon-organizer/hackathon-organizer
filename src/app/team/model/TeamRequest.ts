export interface Tag {
  id: number;
  name: string;
  isSelected?: boolean;
}

export interface TeamRequest {
   ownerId: number;
   hackathonId: number;
   name: string;
   description: string;
   tags: Tag[];
}

export interface TeamResponse {
  id: number;
  ownerId: number;
  hackathonId: number;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  isOpen: boolean;
  teamChatRoomId: number;
  tags: Tag[];
}
