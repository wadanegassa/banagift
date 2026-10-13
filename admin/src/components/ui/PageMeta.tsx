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
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
