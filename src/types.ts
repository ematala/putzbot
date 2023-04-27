export interface Roomie {
  id: number;
  name: string;
  username: string;
}

export interface Duty {
  id: number;
  title: string;
  description: string;
}

export interface Mapping {
  roomie: Roomie;
  duty: Duty;
  done: boolean;
}

export type Trash = Record<string, Array<number>>;
