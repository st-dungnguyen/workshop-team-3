import React from 'react';
import { useTranslation } from 'react-i18next';

import { Spinner } from '@app/shared/components/common';
import { ArticleCard } from '../components/ArticleCard';
import { useArticleList } from '../hooks/useArticleList';

const ArticleList = () => {
  const { t } = useTranslation('articles');
  const { posts, isLoading, error } = useArticleList();
  return (
    <>
      <div className="page-heading">
        <h1 className="page-title">{t('list.title')}</h1>
      </div>
      <div className="page-content">
        {isLoading && <Spinner variant="primary" />}
        {error && <p className="msg-error">{t('list.error')}</p>}
        {!isLoading && !error && (
          <ul className="article-list row">
            {posts?.posts.map((post) => (
              <li key={post.id} className="col-12 col-md-6 col-lg-4">
                <ArticleCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default ArticleList;
