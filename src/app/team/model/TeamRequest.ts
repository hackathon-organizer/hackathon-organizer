export interface Tag {
  id: number;
  name: string;
}

export interface TeamRequest {
   name: string;
   description: string;
   tags: Tag[];
}
