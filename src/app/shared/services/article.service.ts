import { ApiService } from '@core/services/api.service';
import { ENDPOINT } from '@config/endpoint';
import { Post, PostRaw, Posts, PostsRaw } from '../models/article';

export class ArticleService {
  api = new ApiService();

  private toPost(raw: PostRaw): Post {
    return {
      id: raw.id,
      title: raw.title,
      body: raw.body,
      reactions: {
        likes: raw.reactions?.likes ?? 0,
        dislikes: raw.reactions?.dislikes ?? 0,
      },
      views: raw.views ?? 0,
    };
  }

  private toPosts(raw: PostsRaw): Posts {
    return {
      posts: raw.posts?.map((post) => this.toPost(post)) ?? [],
    };
  }

  private async fetchArticleList(): Promise<PostsRaw> {
    return this.api.get<PostsRaw>([ENDPOINT.article.articleList]);
  }

  isReadablePost(post: Post): boolean {
    return Boolean(post.id && post.title.trim() && post.body.trim());
  }

  async getArticleList(): Promise<Posts> {
    const response = await this.fetchArticleList();
    const posts = this.toPosts(response);

    return {
      posts: posts.posts.filter((post) => this.isReadablePost(post)),
    };
  }
}
