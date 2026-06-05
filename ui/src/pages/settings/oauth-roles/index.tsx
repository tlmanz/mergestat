import type { NextPage } from 'next'
import Head from 'next/head'
import { Fragment } from 'react'
import { OauthRolesProvider } from 'src/state/contexts'
import { MERGESTAT_TITLE } from 'src/utils/constants'
import useCrumbsInit from 'src/views/hooks/useCrumbsInit'
import OauthRoles from 'src/views/settings/oauth-roles'

const OauthRolesPage: NextPage = () => {
  const title = `OAuth User Roles - Settings ${MERGESTAT_TITLE}`
  useCrumbsInit()

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
