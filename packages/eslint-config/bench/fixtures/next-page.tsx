import { type Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache, Suspense } from 'react';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: Array<string>;
  publishedAt: string;
  views: number;
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

const getPost = cache(async (slug: string): Promise<Post | null> => {
  const res = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<Post>;
});

const getRelatedPosts = cache(async (postId: string, tags: Array<string>): Promise<Array<Post>> => {
  const params = new URLSearchParams({
    exclude: postId,
    tags: tags.join(','),
    limit: '3',
  });

  const res = await fetch(`https://api.example.com/posts?${params}`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return [];
  }

  return res.json() as Promise<Array<Post>>;
});

async function incrementViewCount(postId: string): Promise<void> {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') ?? 'unknown';

  await fetch(`https://api.example.com/posts/${postId}/views`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': userAgent,
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

function PostSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function RelatedPostCard({ post }: { post: Post }) {
  return (
    <article className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold mb-2">
        <a className="hover:text-blue-600" href={`/posts/${post.id}`}>
          {post.title}
        </a>
      </h3>
      <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
      <div className="flex gap-2 mt-2">
        {post.tags.slice(0, 2).map((tag) => (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded" key={tag}>
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

async function RelatedPosts({ postId, tags }: { postId: string; tags: Array<string> }) {
  const relatedPosts = await getRelatedPosts(postId, tags);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {relatedPosts.map((post) => (
          <RelatedPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

export default async function PostPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort } = await searchParams;

  if (sort === 'invalid') {
    redirect(`/posts/${slug}`);
  }

  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  void incrementViewCount(post.id);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(post.publishedAt));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <article>
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <img alt={post.author.name} className="w-10 h-10 rounded-full" src={post.author.avatar} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300" />
              )}
              <span>{post.author.name}</span>
            </div>
            <time dateTime={post.publishedAt}>{formattedDate}</time>
            <span>{post.views.toLocaleString()} views</span>
          </div>
          <div className="flex gap-2 mt-4">
            {post.tags.map((tag) => (
              <a
                className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200"
                href={`/tags/${tag}`}
                key={tag}
              >
                {tag}
              </a>
            ))}
          </div>
        </header>

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      <Suspense fallback={<PostSkeleton />}>
        <RelatedPosts postId={post.id} tags={post.tags} />
      </Suspense>
    </main>
  );
}
