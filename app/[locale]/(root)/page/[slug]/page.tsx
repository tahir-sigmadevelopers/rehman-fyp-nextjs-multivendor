import ReactMarkdown from 'react-markdown'
import { notFound } from 'next/navigation'
import { getWebPageBySlug } from '@/lib/actions/web-page.actions'
import Link from 'next/link'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params

  const { slug } = params

  const webPage = await getWebPageBySlug(slug)
  if (!webPage) {
    return { title: 'Page Not Found' }
  }
  return {
    title: webPage.title,
  }
}

function PageNotFound({ slug }: { slug: string }) {
  return (
    <div className='p-4 max-w-3xl mx-auto text-center'>
      <h1 className='h1-bold py-4'>Page Not Found</h1>
      <p className='text-lg mb-6'>
        Sorry, the page "{slug}" you are looking for does not exist or is not published.
      </p>
      <div className='space-y-4'>
        <p>You might want to check out these pages instead:</p>
        <div className='flex flex-wrap gap-4 justify-center'>
          <Link href="/" className='text-primary hover:underline'>
            Home
          </Link>
          <Link href="/search" className='text-primary hover:underline'>
            Products
          </Link>
          <Link href="/shops" className='text-primary hover:underline'>
            Shops
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function WebPageDetailsPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const params = await props.params
  const { slug } = params
  const webPage = await getWebPageBySlug(slug)

  if (!webPage) {
    return <PageNotFound slug={slug} />
  }

  return (
    <div className='p-4 max-w-3xl mx-auto'>
      <h1 className='h1-bold py-4'>{webPage.title}</h1>
      <section className='text-justify text-lg mb-20 web-page-content'>
        <ReactMarkdown>{webPage.content}</ReactMarkdown>
      </section>
    </div>
  )
}
