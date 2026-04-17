//app/lib/common.ts

export function isProductionMode() {
  return process.env.NODE_ENV === 'production';
}

export function setSEOMetadata({
  title,
  description,
  url,
  image,
  keywords,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  keywords?: string;
}) {
  document.title = title;

  const metaTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ];

  if (keywords) {
    metaTags.push({ name: 'keywords', content: keywords });
  }

  metaTags.forEach((tag) => {
    let meta = document.querySelector(
      tag.property
        ? `meta[property="${tag.property}"]`
        : `meta[name="${tag.name}"]`,
    );
    if (!meta) {
      meta = document.createElement('meta');
      if (tag.property) {
        meta.setAttribute('property', tag.property);
      } else {
        meta.setAttribute('name', tag.name!);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', tag.content);
  });
}
