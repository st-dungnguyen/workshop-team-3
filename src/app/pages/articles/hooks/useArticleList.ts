import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

import { ArticleService } from '@app/shared/services/article.service';
import { Posts } from '@app/shared/models/article';
import { AppError } from '@app/shared/models/app-error.model';
import { normalizeError } from '@app/shared/utils/error.utils';

export const useArticleList = () => {
  const articleService = useMemo(() => new ArticleService(), []);
  const [posts, setPosts] = useState<Posts | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchArticles = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const response = await articleService.getArticleList();
        setPosts(response);
      } catch (err) {
        setError(normalizeError(err));
        setPosts(null);
      }
    });
  }, [articleService]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    posts,
    isLoading: isPending,
    error,
    refetch: fetchArticles,
  };
};
