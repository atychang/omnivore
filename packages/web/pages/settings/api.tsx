import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { showErrorToast, showSuccessToast } from '../../lib/toastHelpers'
import { applyStoredTheme } from '../../lib/themeUpdater'
import { useGetApiKeysQuery } from '../../lib/networking/queries/useGetApiKeysQuery'
import { generateApiKeyMutation } from '../../lib/networking/mutations/generateApiKeyMutation'
import { revokeApiKeyMutation } from '../../lib/networking/mutations/revokeApiKeyMutation'

import { FormInputProps } from '../../components/elements/FormElements'
import { FormModal } from '../../components/patterns/FormModal'
import { ConfirmationModal } from '../../components/patterns/ConfirmationModal'
import {
  EmptySettingsRow,
  SettingsTable,
  SettingsTableRow,
} from '../../components/templates/settings/SettingsTable'
import { StyledText } from '../../components/elements/StyledText'
import { formattedShortDate } from '../../lib/dateFormatting'

export default function Api(): JSX.Element {
  const { apiKeys, revalidate, isValidating } = useGetApiKeysQuery()
  const [onDeleteId, setOnDeleteId] = useState<string>('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [name, setName] = useState<string>('')
  const [value, setValue] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<Date>(new Date())
  const [formInputs, setFormInputs] = useState<FormInputProps[]>([])
  const [apiKeyGenerated, setApiKeyGenerated] = useState('')
  const neverExpiresDate = new Date(8640000000000000)
  const defaultExpiresAt = 'Never'

  const router = useRouter()
  useEffect(() => {
    if (Object.keys(router.query).length) {
      setValue(`${router.query?.create}`)
      setExpiresAt(new Date(defaultExpiresAt))
      onAdd()
      setAddModalOpen(true)
    }
  }, [router.query])

  applyStoredTheme(false)

  async function onDelete(id: string): Promise<void> {
    const result = await revokeApiKeyMutation(id)
    if (result) {
      showSuccessToast('API Key deleted', { position: 'bottom-right' })
    } else {
      showErrorToast('Failed to delete', { position: 'bottom-right' })
    }
    revalidate()
  }

  async function onCreate(): Promise<void> {
    const result = await generateApiKeyMutation({ name, expiresAt })
    if (result) {
      setApiKeyGenerated(result)
      showSuccessToast('API key generated', { position: 'bottom-right' })
    } else {
      showErrorToast('Failed to add', { position: 'bottom-right' })
    }
    revalidate()
  }

  function onAdd() {
    return setFormInputs([
      {
        label: 'Name',
        onChange: setName,
        name: 'name',
        value: `${router.query?.create ? router.query?.create : value}`,
        required: true,
      },
      {
        label: 'Expires',
        name: 'expiredAt',
        required: true,
        onChange: (e) => {
          console.log('onChange: ', e)
          let additionalDays = 0
          switch (e.target.value) {
            case 'in 7 days':
              additionalDays = 7
              break
            case 'in 30 days':
              additionalDays = 30
              break
            case 'in 90 days':
              additionalDays = 90
              break
            case 'in 1 year':
              additionalDays = 365
              break
            case 'Never':
              break
          }
          const newExpires = additionalDays ? new Date() : neverExpiresDate
          if (additionalDays) {
            newExpires.setDate(newExpires.getDate() + additionalDays)
          }
          setExpiresAt(newExpires)
        },
        type: 'select',
        options: [
          'in 7 days',
          'in 30 days',
          'in 90 days',
          'in 1 year',
          'Never',
        ],
        value: defaultExpiresAt,
      },
    ])
  }

  const sortedApiKeys = useMemo(() => {
    if (!apiKeys) {
      return []
    }
    return apiKeys.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [apiKeys])

  return (
    <SettingsTable
      pageId="api-keys"
      pageHeadline="API Keys"
      pageInfoLink="https://docs.omnivore.app/integrations/api.html"
      headerTitle="API Keys"
      createTitle="Generate API Key"
      createAction={() => {
        onAdd()
        setName('')
        setExpiresAt(new Date(defaultExpiresAt))
        setAddModalOpen(true)
      }}
    >
      {sortedApiKeys.length > 0 ? (
        sortedApiKeys.map((apiKey, i) => {
          return (
            <SettingsTableRow
              key={apiKey.id}
              title={apiKey.name}
              isLast={i === apiKeys.length - 1}
              onDelete={() => {
                console.log('onDelete triggered: ', apiKey.id)
                setOnDeleteId(apiKey.id)
              }}
              deleteTitle="Delete"
              sublineElement={
                <StyledText
                  css={{
                    my: '5px',
                    fontSize: '11px',
                    a: {
                      color: '$omnivoreCtaYellow',
                    },
                  }}
                >
                  {`Last used: ${
                    apiKey.usedAt ? formattedShortDate(apiKey.usedAt) : 'Never'
                  }, `}
                  {apiKey.expiresAt &&
                  apiKey.expiresAt != neverExpiresDate.toISOString()
                    ? `expires: ${formattedShortDate(apiKey.expiresAt)}`
                    : 'never expires'}
                </StyledText>
              }
            />
          )
        })
      ) : (
        <EmptySettingsRow text={isValidating ? '-' : 'No API Keys Found'} />
      )}

      {addModalOpen && (
        <FormModal
          title={'Generate API Key'}
          onSubmit={onCreate}
          onOpenChange={setAddModalOpen}
          inputs={formInputs}
          acceptButtonLabel={'Generate'}
        />
      )}

      {apiKeyGenerated && (
        <ConfirmationModal
          message={`API key generated. Copy the key and use it in your application.
                    You won’t be able to see it again!
                    Key: ${apiKeyGenerated}`}
          acceptButtonLabel="Copy"
          cancelButtonLabel="Close"
          onAccept={async () => {
            await navigator.clipboard.writeText(apiKeyGenerated)
            setApiKeyGenerated('')
          }}
          onOpenChange={() => setApiKeyGenerated('')}
        />
      )}

      {onDeleteId && (
        <ConfirmationModal
          message={'API key will be revoked. This action cannot be undone.'}
          onAccept={async () => {
            await onDelete(onDeleteId)
            setOnDeleteId('')
          }}
          onOpenChange={() => setOnDeleteId('')}
        />
      )}
    </SettingsTable>
  )
}
