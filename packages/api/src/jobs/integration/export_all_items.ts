import { IntegrationType } from '../../entity/integration'
import { findIntegration } from '../../services/integrations'
import { findRecentLibraryItems } from '../../services/library_item'
import { findActiveUser } from '../../services/user'
import { enqueueExportItem } from '../../utils/createTask'
import { logger } from '../../utils/logger'

export interface ExportAllItemsJobData {
  userId: string
  integrationId: string
}

export const EXPORT_ALL_ITEMS_JOB_NAME = 'export-all-items'

export const exportAllItems = async (jobData: ExportAllItemsJobData) => {
  const { userId, integrationId } = jobData
  const user = await findActiveUser(userId)
  if (!user) {
    logger.error('user not found', {
      userId,
    })
    return
  }

  const integration = await findIntegration(
    {
      id: integrationId,
      enabled: true,
      type: IntegrationType.Export,
    },
    userId
  )

  if (!integration) {
    logger.error('integration not found', {
      userId,
      integrationId,
    })
    return
  }

  const maxItems = 1000
  const limit = 100
  let offset = 0
  // get max 1000 most recent items from the database
  while (offset < maxItems) {
    const libraryItems = await findRecentLibraryItems(userId, limit, offset)
    if (libraryItems.length === 0) {
      logger.info('no library items found', {
        userId,
      })
      return
    }

    logger.info('enqueuing export item...', {
      userId,
      offset,
      integrationId,
    })

    await enqueueExportItem({
      userId,
      libraryItemIds: libraryItems.map((item) => item.id),
      integrationId,
    })

    offset += libraryItems.length

    logger.info('exported items', {
      userId,
      offset,
      integrationId,
    })
  }
}
