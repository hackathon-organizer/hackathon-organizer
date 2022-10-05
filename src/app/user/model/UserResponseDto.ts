import {TagResponseDto} from "./TagResponseDto";

export class UserResponseDto {
  id: number;
  username: string;
  keyCloakId: string;
  accountType: string;
  githubProfileUrl: string;
  profilePictureUrl: string;
  tags: TagResponseDto[];


  constructor(id: number, username: string, keyCloakId: string, accountType: string, githubProfileUrl: string, profilePictureUrl: string, tags: TagResponseDto[]) {
    this.id = id;
    this.username = username;
    this.keyCloakId = keyCloakId;
    this.accountType = accountType;
    this.githubProfileUrl = githubProfileUrl;
    this.profilePictureUrl = profilePictureUrl;
    this.tags = tags;
  }
}
