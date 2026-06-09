import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Fragment, useEffect } from 'react'
import { OauthRolesProvider } from 'src/state/contexts'
import { MERGESTAT_TITLE } from 'src/utils/constants'
import useCrumbsInit from 'src/views/hooks/useCrumbsInit'
import useIsAdmin from 'src/views/hooks/useIsAdmin'
import OauthRoles from 'src/views/settings/oauth-roles'

const OauthRolesPage: NextPage = () => {
  const title = `OAuth User Roles - Settings ${MERGESTAT_TITLE}`
  const router = useRouter()
  const { loading, isAdmin } = useIsAdmin()
  useCrumbsInit()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/settings/user-settings')
    }
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return null
  }

  return (
    <Fragment>
      <Head>
        <title>{title}</title>
      </Head>
      <OauthRolesProvider>
        <OauthRoles />
      </OauthRolesProvider>
    </Fragment>
  )
}

export default OauthRolesPage
