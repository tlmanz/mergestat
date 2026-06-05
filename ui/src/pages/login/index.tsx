import { Alert, Button, HelpText, Input, Label, Panel } from '@mergestat/blocks'
import { Icon } from '@mergestat/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { getProviders, signIn } from 'next-auth/react'
import { ChangeEvent, Fragment, useEffect, useState } from 'react'
import { auth } from 'src/api-logic/axios/api'
import { MERGESTAT_TITLE } from 'src/utils/constants'

type OAuthProvider = { id: string, name: string }

const LoginPage = () => {
  const title = `Login  ${MERGESTAT_TITLE}`
  const router = useRouter()
  const { lostSession } = router.query

  const [user, setUser] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<boolean>(false)
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([])

  // Discover which OAuth providers are configured on the server (a provider is
  // only registered when its credentials are present), so we render only the
  // buttons that will actually work.
  useEffect(() => {
    getProviders()
      .then((providers) => {
        setOauthProviders(providers ? Object.values(providers).map(({ id, name }) => ({ id, name })) : [])
      })
      .catch(() => setOauthProviders([]))
  }, [])

  const handleLogin = async () => {
    setError(false)
    const login = await auth(user, password)
    login ? router.push('/explore') : setError(true)
  }

  return (
    <Fragment>
      <Head>
        <title>{title}</title>
      </Head>
      <main className="w-full min-h-screen h-full flex flex-col items-center justify-center bg-gray-800">
        <Panel className="w-full max-w-lg">
          <Panel.Header>
            <Icon
              as="/logo.svg"
              width={144}
              className="flex w-auto items-center"
            />
          </Panel.Header>
          <Panel.Body>
            {lostSession && (
              <Alert theme="light" type="warning" className="mb-6" >
                Your session has expired. Please log in again.
              </Alert>
            )}

            {oauthProviders.length > 0 && (
              <div className="mb-6 space-y-3">
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    isBlock
                    skin="secondary"
                    label={`Sign in with ${provider.name}`}
                    onClick={() => signIn(provider.id, { callbackUrl: '/explore' })}
                  />
                ))}
                <div className="flex items-center gap-3 text-gray-400">
                  <span className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm">or</span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>
              </div>
            )}

            <Alert type="info" className="mb-6">
              Login using your MergeStat <strong>database credentials</strong>.
            </Alert>

            <form className="space-y-4">
              <div>
                <Label>Database user
                  <Input value={user} placeholder="username"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setUser(e.target.value)}
                    onKeyPress={(e) => (e.key === 'Enter' && handleLogin())}
                  />
                </Label>
              </div>
              <div>
                <Label>Database password
                  <Input type="password" value={password} placeholder="password" variant={error ? 'error' : 'default'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    onKeyPress={(e) => (e.key === 'Enter' && handleLogin())}
                  />
                </Label>
                {error && (
                  <HelpText variant="error">Incorrect password</HelpText>
                )}
              </div>
              <Button isBlock label="Log in" onClick={handleLogin} />
            </form>
          </Panel.Body>
        </Panel>
      </main>
    </Fragment>
  )
}

LoginPage.layout = 'fullscreen'

export default LoginPage
