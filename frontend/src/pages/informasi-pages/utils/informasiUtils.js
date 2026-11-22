const CMS_ORIGIN = 'http://localhost:5000';

export function formatInformasiDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(date);
}

export function normalizeCmsPost(post) {
  const publishedAt = post.published_at || post.created_at || null;

  let image = post.image || '';

  if (image && !/^https?:\/\//i.test(image)) {
    image = `${CMS_ORIGIN}/${image.replace(/^\/+/, '')}`;
  }

  return {
    id: post.id,
    slug: post.slug,
    type: post.category === 'berita' ? 'Berita' : 'Pengumuman',
    publishedAt,
    category: post.content_category || 'Informasi Umum',
    title: post.title || '',
    date: formatInformasiDate(publishedAt),
    image,
    summary: post.summary || '',
    content: post.content || '',
  };
}

export function normalizeCmsFaq(faq) {
  return {
    id: faq.id,
    topic: faq.category || 'Umum',
    question: faq.question || '',
    answer: faq.answer || '',
  };
}

export function isNewContent(item, now = Date.now()) {
  if (!item?.publishedAt) return false;

  const publishedTime = new Date(item.publishedAt).getTime();

  if (Number.isNaN(publishedTime)) return false;

  const age = now - publishedTime;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return age >= 0 && age <= sevenDays;
}
