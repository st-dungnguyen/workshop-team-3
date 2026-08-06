# Data Flow

Use this reference when implementing or reviewing a feature end to end.

The project avoids React Router loaders for feature data fetching. Keep data fetching in custom hooks, form/action handlers, or the existing generic API hook so the feature is not tightly coupled to router data APIs.

## Patterns In Use

### Pattern A: Feature custom hook

Use this as the default pattern for read data that belongs to a page or feature.

Generic shape:

```txt
pages/<feature>/containers/<FeatureList>.tsx
  -> pages/<feature>/hooks/use<Feature>List.ts
      -> shared/services/<feature>.service.ts
          -> core/services/api.service.ts
  -> container renders loading/error/content states
  -> container passes data to feature/shared components
```

Mini game example using the same shape:

```txt
reward.routes.ts
  -> RewardResult.tsx
      -> useRewardCoupon()
          -> RewardService.getCouponResult()
              -> ApiService.get()
      -> CouponCard
```

The boilerplate source has an `articles` implementation of this pattern (`ArticleList.tsx` → `useArticleList()` → `ArticleService`). It's a working reference for the hook/service structure but is not a mini game feature. The reward example above is the target shape for this project.

Read the two diagrams as the same flow: the first shows the reusable template, and the second maps it to real mini game files.

```tsx
// pages/articles/containers/ArticleList.tsx
const ArticleList = () => {
  const { posts, isLoading, error } = useArticleList();

  if (isLoading) return <Spinner />;
  if (error) return <p className="msg-error">Unable to load articles.</p>;

  return (
    <ul className="article-list row">
      {posts?.posts.map((post) => (
        <ArticleCard key={post.id} post={post} />
      ))}
    </ul>
  );
};
```

Use this pattern when:

- a route needs read data
- the screen owns loading/error/empty states
- the data may later need refresh, search, filtering, pagination, or other UI-driven behavior
- you want to keep data loading independent from router-specific APIs

### Pattern B: Direct service call in the container

Used by form submits and one-off actions such as login. The container owns the event handler, local loading state, success behavior, and error display.

```tsx
const auth = new AuthService();
const [isLoading, setIsLoading] = useState(false);

const onLogin = useCallback(async (data) => {
  setIsLoading(true);
  try {
    const res = await auth.signIn<User>(data);
    setUserSession(res);
    auth.setToken(res.accessToken);
    navigate('/');
  } finally {
    setIsLoading(false);
  }
}, [auth, setUserSession, navigate]);
```

Use this pattern for form submits and actions whose loading, validation, success, and redirect behavior is specific to one screen.

## Service Classes

Domain services in `shared/services/` and infrastructure services in `core/services/` are classes.

```ts
// shared/services/article.service.ts
import { ApiService } from '@core/services/api.service';
import { ENDPOINT } from '@config/endpoint';
import { Post, PostRaw, Posts, PostsRaw } from '../models/article';

export class ArticleService {
  api = new ApiService();

  // ---------------------------------------------------------------------------
  // PART 1 - HTTP CALLS
  //
  // - Call API and receive raw responses
  // - Map raw responses to domain types
  // - Keep HTTP details private to the service
  // - Do not contain business logic
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // PART 2 - BUSINESS LOGIC
  //
  // - Pure business rules
  // - Export through public methods when hooks or tests need the rule directly
  // - Do not import React or call APIs
  // ---------------------------------------------------------------------------

  isReadablePost(post: Post): boolean {
    return Boolean(post.id && post.title.trim() && post.body.trim());
  }

  // ---------------------------------------------------------------------------
  // PART 3 - USE CASES
  //
  // - Orchestrate HTTP calls and business logic into a user-facing flow
  // - Public methods are called by hooks or containers
  // ---------------------------------------------------------------------------

  async getArticleList(): Promise<Posts> {
    const response = await this.fetchArticleList();
    const posts = this.toPosts(response);

    return {
      posts: posts.posts.filter((post) => this.isReadablePost(post)),
    };
  }
}
```

A service:

- holds an `ApiService` instance or delegates to one
- exposes public async methods per operation
- is callable from a hook or a container action
- keeps HTTP details and raw-to-domain response shaping out of containers/components
- keeps business rules in pure methods that do not call APIs or import React
- keeps public use cases as orchestration methods called by hooks or containers
- does not import React or router APIs

If a feature has no real business rule yet, keep the business section minimal. Do not invent product rules just to fill the section.

## Feature Checklist

When adding a feature, identify:

1. Page container in `pages/<feature>/containers/`.
2. Feature hook in `pages/<feature>/hooks/` for read data, loading, error, refresh, search, or pagination.
3. Service class in `shared/services/<feature>.service.ts` for API calls and response shaping.
4. Domain type in `shared/models/`.
5. Presentation components in `pages/<feature>/components/` if feature-local, or `shared/components/` if reusable.
6. Route definition in `pages/<feature>/<feature>.routes.ts`, registered in `pages/page.routes.ts`.
