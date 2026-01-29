/*
 * REKBERKAN BLOG DETAIL PAGE - Professional Version
 * Brand color: #000000
 * Features: Full article view, author info, related posts, social sharing, comments
 */

import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, User, CalendarBlank, Tag, ShareNetwork,
  TwitterLogo, FacebookLogo, LinkedinLogo, Link as LinkIcon,
  BookmarkSimple, Heart, ChatCircle, CaretRight, Copy, Check,
  ArrowRight, Eye, Spinner
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import LandingLayout from '@/components/layout/LandingLayout';

interface Author {
  name: string;
  avatar: string;
  role: string;
  bio: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: Author;
  publishedAt: string;
  readTime: number;
  views: number;
  likes: number;
  commentsCount: number;
}

interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  category: string;
  publishedAt: string;
  readTime: number;
}

// Mock data - replace with API call
const mockPost: BlogPost = {
  id: '1',
  slug: 'escrow-security-best-practices',
  title: 'Escrow Security Best Practices: Protecting Your Online Transactions in 2025',
  excerpt: 'Learn how to protect yourself when buying or selling online with these essential escrow security practices.',
  content: `
    <p class="lead">In the rapidly evolving digital marketplace, securing your online transactions has never been more critical. Escrow services have emerged as a cornerstone of trust in e-commerce, providing a safety net for both buyers and sellers.</p>
    
    <h2>Understanding Escrow Services</h2>
    <p>An escrow service acts as a neutral third party that holds funds during a transaction. The money is only released to the seller once the buyer confirms they've received the goods or services as described. This simple yet powerful mechanism has revolutionized online commerce.</p>
    
    <blockquote>
      <p>"Trust is the foundation of all commerce. Escrow services provide that trust in the digital age."</p>
      <cite>— Financial Security Expert</cite>
    </blockquote>
    
    <h2>Key Security Features to Look For</h2>
    <p>When choosing an escrow service, consider these essential security features:</p>
    
    <h3>1. Two-Factor Authentication (2FA)</h3>
    <p>Always enable 2FA on your escrow account. This adds an extra layer of security by requiring a second form of verification beyond just your password.</p>
    
    <h3>2. End-to-End Encryption</h3>
    <p>Ensure the platform uses bank-level encryption (256-bit SSL) to protect your data and financial information during transmission.</p>
    
    <h3>3. Verified Identity System</h3>
    <p>Look for platforms that implement KYC (Know Your Customer) verification. This helps ensure you're dealing with legitimate parties.</p>
    
    <h2>Best Practices for Buyers</h2>
    <ul>
      <li>Always verify the seller's reputation and history</li>
      <li>Use the platform's messaging system for all communications</li>
      <li>Document everything with photos and screenshots</li>
      <li>Never release funds until you've thoroughly inspected the goods</li>
      <li>Report any suspicious activity immediately</li>
    </ul>
    
    <h2>Best Practices for Sellers</h2>
    <ul>
      <li>Provide accurate and detailed descriptions of your items</li>
      <li>Use tracking numbers for all shipments</li>
      <li>Respond promptly to buyer inquiries</li>
      <li>Keep records of all transactions</li>
      <li>Build your reputation through consistent quality service</li>
    </ul>
    
    <h2>The Future of Secure Transactions</h2>
    <p>As technology advances, we're seeing new innovations in transaction security. Blockchain-based escrow, smart contracts, and AI-powered fraud detection are shaping the future of secure online commerce.</p>
    
    <p>At Rekberkan, we're committed to implementing the latest security technologies to protect our users. Our platform combines traditional escrow reliability with cutting-edge security features to provide the safest transaction experience possible.</p>
    
    <h2>Conclusion</h2>
    <p>Security in online transactions is a shared responsibility. By choosing a reputable escrow service and following best practices, you can significantly reduce your risk and enjoy the benefits of the digital marketplace with confidence.</p>
  `,
  coverImage: '/images/blog/escrow-security.jpg',
  category: 'Security',
  tags: ['Security', 'Escrow', 'Best Practices', 'Online Safety'],
  author: {
    name: 'Ahmad Rizky',
    avatar: '/images/team/ahmad.jpg',
    role: 'Security Analyst',
    bio: 'Ahmad is a cybersecurity expert with over 10 years of experience in fintech security. He leads our security initiatives at Rekberkan.'
  },
  publishedAt: '2025-01-15T10:00:00Z',
  readTime: 8,
  views: 2456,
  likes: 128,
  commentsCount: 24
};

const mockRelatedPosts: RelatedPost[] = [
  {
    id: '2',
    slug: 'how-escrow-works',
    title: 'How Escrow Works: A Complete Guide for Beginners',
    excerpt: 'Everything you need to know about escrow services and how they protect your transactions.',
    coverImage: '/images/blog/how-escrow-works.jpg',
    category: 'Guide',
    publishedAt: '2025-01-10T10:00:00Z',
    readTime: 6
  },
  {
    id: '3',
    slug: 'avoiding-online-scams',
    title: '10 Red Flags to Spot Online Scams Before It\'s Too Late',
    excerpt: 'Learn to identify common scam tactics and protect yourself from fraudulent transactions.',
    coverImage: '/images/blog/avoid-scams.jpg',
    category: 'Security',
    publishedAt: '2025-01-05T10:00:00Z',
    readTime: 5
  },
  {
    id: '4',
    slug: 'marketplace-success-tips',
    title: 'Marketplace Success: Tips for Buyers and Sellers',
    excerpt: 'Maximize your success on online marketplaces with these proven strategies.',
    coverImage: '/images/blog/marketplace-tips.jpg',
    category: 'Tips',
    publishedAt: '2024-12-28T10:00:00Z',
    readTime: 7
  }
];

export default function BlogDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // In production, fetch from API: await blogApi.getPost(params.slug)
        await new Promise(resolve => setTimeout(resolve, 500));
        setPost(mockPost);
        setRelatedPosts(mockRelatedPosts);
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [params.slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Removed from likes' : 'Added to likes');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
  };

  if (isLoading) {
    return (
      <LandingLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="w-10 h-10 animate-spin text-black" weight="bold" />
        </div>
      </LandingLayout>
    );
  }

  if (!post) {
    return (
      <LandingLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">Article Not Found</h1>
            <p className="text-[#6B7280] mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Link href="/blog">
              <Button className="bg-black text-white hover:bg-black/90">
                <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <article className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-[#6B7280] mb-6">
              <Link href="/" className="hover:text-black transition-colors">Home</Link>
              <CaretRight className="w-4 h-4" weight="bold" />
              <Link href="/blog" className="hover:text-black transition-colors">Blog</Link>
              <CaretRight className="w-4 h-4" weight="bold" />
              <span className="text-black">{post.category}</span>
            </nav>

            {/* Category & Meta */}
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-black text-white hover:bg-black/90">{post.category}</Badge>
              <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" weight="regular" />
                  {post.readTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" weight="regular" />
                  {post.views.toLocaleString()} views
                </span>
              </div>
            </div>

            {/* Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight"
            >
              {post.title}
            </motion.h1>

            {/* Author & Date */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.author.avatar} alt={post.author.name} />
                  <AvatarFallback className="bg-black text-white">
                    {post.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-black">{post.author.name}</div>
                  <div className="text-sm text-[#6B7280]">
                    {post.author.role} • {formatDate(post.publishedAt)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLike}
                  className={`border-[#E5E5E5] ${isLiked ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
                >
                  <Heart className="w-4 h-4 mr-1" weight={isLiked ? 'fill' : 'regular'} />
                  {post.likes + (isLiked ? 1 : 0)}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleBookmark}
                  className={`border-[#E5E5E5] ${isBookmarked ? 'bg-amber-50 border-amber-200 text-amber-600' : ''}`}
                >
                  <BookmarkSimple className="w-4 h-4" weight={isBookmarked ? 'fill' : 'regular'} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="max-w-5xl mx-auto px-6 -mt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="aspect-[2/1] rounded-2xl overflow-hidden bg-[#F5F5F5]"
          >
            <img 
              src={post.coverImage} 
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/1200x600/f5f5f5/6b7280?text=Blog+Cover';
              }}
            />
          </motion.div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-12">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="prose prose-lg max-w-none
                prose-headings:text-black prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-[#374151] prose-p:leading-relaxed
                prose-a:text-black prose-a:underline hover:prose-a:no-underline
                prose-strong:text-black
                prose-ul:my-4 prose-li:text-[#374151]
                prose-blockquote:border-l-4 prose-blockquote:border-black prose-blockquote:bg-[#FAFAFA] prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
                prose-blockquote:text-[#374151]"
              // SECURITY FIX [H001]: Sanitize HTML content to prevent XSS
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, {
                ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 
                  'blockquote', 'pre', 'code', 'em', 'strong', 'a', 'img', 'table', 'thead', 
                  'tbody', 'tr', 'th', 'td', 'span', 'div'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'],
                ALLOW_DATA_ATTR: false,
                ADD_ATTR: ['target'],
                FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
                FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
              }) }}
            />

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {/* Share */}
                <div className="bg-[#FAFAFA] rounded-xl p-4">
                  <div className="text-sm font-medium text-black mb-3">Share this article</div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-[#E5E5E5]"
                      onClick={() => handleShare('twitter')}
                    >
                      <TwitterLogo className="w-4 h-4 mr-2" weight="fill" />
                      Twitter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-[#E5E5E5]"
                      onClick={() => handleShare('facebook')}
                    >
                      <FacebookLogo className="w-4 h-4 mr-2" weight="fill" />
                      Facebook
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-[#E5E5E5]"
                      onClick={() => handleShare('linkedin')}
                    >
                      <LinkedinLogo className="w-4 h-4 mr-2" weight="fill" />
                      LinkedIn
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-[#E5E5E5]"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" weight="bold" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" weight="regular" />
                          Copy link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-[#FAFAFA] rounded-xl p-4">
                  <div className="text-sm font-medium text-black mb-3">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                        <Badge variant="outline" className="border-[#E5E5E5] hover:bg-black hover:text-white transition-colors cursor-pointer">
                          {tag}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Tags (Mobile) */}
          <div className="lg:hidden mt-8 pt-8 border-t border-[#E5E5E5]">
            <div className="text-sm font-medium text-black mb-3">Tags</div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                  <Badge variant="outline" className="border-[#E5E5E5] hover:bg-black hover:text-white transition-colors cursor-pointer">
                    {tag}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-12 p-6 bg-[#FAFAFA] rounded-2xl">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback className="bg-black text-white text-lg">
                  {post.author.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm text-[#6B7280] mb-1">Written by</div>
                <div className="text-lg font-bold text-black">{post.author.name}</div>
                <div className="text-sm text-[#6B7280] mb-3">{post.author.role}</div>
                <p className="text-[#374151]">{post.author.bio}</p>
              </div>
            </div>
          </div>

          {/* Share (Mobile) */}
          <div className="lg:hidden mt-8 flex items-center justify-center gap-3">
            <span className="text-sm text-[#6B7280]">Share:</span>
            <Button variant="outline" size="icon" className="border-[#E5E5E5]" onClick={() => handleShare('twitter')}>
              <TwitterLogo className="w-4 h-4" weight="fill" />
            </Button>
            <Button variant="outline" size="icon" className="border-[#E5E5E5]" onClick={() => handleShare('facebook')}>
              <FacebookLogo className="w-4 h-4" weight="fill" />
            </Button>
            <Button variant="outline" size="icon" className="border-[#E5E5E5]" onClick={() => handleShare('linkedin')}>
              <LinkedinLogo className="w-4 h-4" weight="fill" />
            </Button>
            <Button variant="outline" size="icon" className="border-[#E5E5E5]" onClick={handleCopyLink}>
              {copied ? <Check className="w-4 h-4" weight="bold" /> : <Copy className="w-4 h-4" weight="regular" />}
            </Button>
          </div>
        </div>

        {/* Related Posts */}
        <div className="bg-[#FAFAFA] border-t border-[#E5E5E5] py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-black">Related Articles</h2>
              <Link href="/blog">
                <Button variant="outline" className="border-[#E5E5E5]">
                  View all
                  <ArrowRight className="w-4 h-4 ml-2" weight="bold" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost, index) => (
                <motion.article
                  key={relatedPost.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden group hover:shadow-lg transition-shadow"
                >
                  <Link href={`/blog/${relatedPost.slug}`}>
                    <div className="aspect-[16/9] overflow-hidden">
                      <img 
                        src={relatedPost.coverImage} 
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x225/f5f5f5/6b7280?text=Blog';
                        }}
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="border-[#E5E5E5] text-xs">{relatedPost.category}</Badge>
                        <span className="text-xs text-[#6B7280]">{relatedPost.readTime} min read</span>
                      </div>
                      <h3 className="font-semibold text-black mb-2 line-clamp-2 group-hover:underline">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-[#6B7280] line-clamp-2">{relatedPost.excerpt}</p>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </div>

        {/* Back to Blog */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/blog">
            <Button variant="outline" className="border-[#E5E5E5]">
              <ArrowLeft className="w-4 h-4 mr-2" weight="bold" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </article>
    </LandingLayout>
  );
}
