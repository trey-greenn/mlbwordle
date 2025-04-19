import Head from 'next/head';

type SEOProps = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  structuredData?: object | null;
};

const SEO = ({
    title = 'MLB Wordle - Guess the Mystery MLB Player',
    description = 'Challenge yourself with MLB Wordle, the ultimate guessing game for baseball fans. Test your knowledge of Major League Baseball players by guessing the mystery player in a limited number of tries. Enjoy a fun and engaging way to learn more about your favorite MLB stars.',
    url = 'www.mlbwordle.com',
  image = '/wordle.png',
  type = 'website',
  structuredData = null,
}: SEOProps) => {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  );
};

export default SEO;
