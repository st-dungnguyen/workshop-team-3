export type Post = {
  id: number;
  title: string;
  body: string;
  reactions: {
    likes: number;
    dislikes: number;
  };
  views: number;
};

export type PostRaw = {
  id: number;
  title: string;
  body: string;
  reactions?: {
    likes?: number;
    dislikes?: number;
  };
  views?: number;
};

export type Posts = {
  posts: Post[];
};

export type PostsRaw = {
  posts?: PostRaw[];
};
