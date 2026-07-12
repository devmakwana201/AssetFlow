/** Small helper that appends `assetflow.app` to the current route meta title */
export const appendToMetaTitle = (title: string | null | undefined) =>
  `${title ? title : "Not found"} | assetflow.app`;
