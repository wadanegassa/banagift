import { Helmet } from 'react-helmet-async';

export interface PageMetaProps {
  title: string;
  description?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'BanaGifts';

export function PageMeta({ title, description, noIndex }: PageMetaProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <link rel="icon" type="image/png" href="/banagifts-tab-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/banagifts-tab-icon-32.png" />
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
