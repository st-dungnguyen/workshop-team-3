import React, { use, useCallback, useState, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { AuthContext } from '@app/shared/contexts/auth.context';
import { AuthService } from '@app/core/services/auth.service';
import { Button, Input } from '@app/shared/components/partials';
import { User } from '@app/shared/models/user';
import { normalizeError } from '@app/shared/utils/error.utils';

type LoginForm = {
  username: string;
  password: string;
};

const Login = () => {
  const [isPending, startTransition] = useTransition();
  const [apiError, setApiError] = useState<string | null>(null);
  const auth = new AuthService();
  const { setUserSession } = use(AuthContext)!;
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  const schema = z.object({
    username: z.string().nonempty(t('logIn.username.error.required')),
    password: z.string().nonempty(t('logIn.password.error.required')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    mode: 'onChange',
    resolver: zodResolver(schema) as Resolver<LoginForm>,
  });

  const onLogin = useCallback(
    // Demo login info: emilys/emilyspass
    (data: LoginForm) => {
      setApiError(null);
      startTransition(async () => {
        try {
          const res = await auth.signIn<User>(data);
          setUserSession(res);
          auth.setToken(res.accessToken);
          navigate('/');
        } catch (err) {
          setApiError(normalizeError(err).message);
        }
      });
    },
    [auth, setUserSession, navigate],
  );

  return (
    <>
      <div className="page-heading">
        <h1 className="page-title">{t('logIn.title')}</h1>
      </div>
      <div className="page-content">
        <form className="form" onSubmit={handleSubmit(onLogin)}>
          <Input
            type="text"
            name="username"
            register={register('username')}
            label={t('logIn.username.label')}
            errorMsg={errors.username?.message}
          />
          <Input
            type="password"
            name="password"
            register={register('password')}
            label={t('logIn.password.label')}
            errorMsg={errors.password?.message}
          />
          <div className="form-group">
            <Button
              type="submit"
              className="btn btn-primary btn-block"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
              title={t('logIn.btn')}
            />
          </div>
          {apiError && <p className="form-error">{apiError}</p>}
        </form>
        <div className="tips txt-center">
          <Link to="/" className="txt-link">
            {t('logIn.forgotPassword')}
          </Link>
          <p>
            {t('logIn.noAccount')}
            <Link to="/auth/register" className="txt-link ml-1">
              {t('logIn.register')}
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
