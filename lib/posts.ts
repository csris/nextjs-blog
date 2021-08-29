import fs from 'fs'
import html from 'remark-html'
import matter from 'gray-matter'
import path from 'path'
import remark from 'remark'

const postsDirectory = path.join(process.cwd(), 'posts')


export interface PostMetadata {
  id: string;
  title: string;
  date: string;
}

export interface PostData extends PostMetadata {
  contentHtml: string;
}

type ParsedPostMetadata = {
  title?: string;
  date?: string;
}

type ParsedPost = {
  data: ParsedPostMetadata;
  content: string;
}

interface PostIdParams {
  params: {
    id: string;
  };
}


function parsePost(fileContents: string): ParsedPost {
  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Combine the data with the id
  return { 
    data: matterResult.data, 
    content: matterResult.content 
  }
}

function readPost(id: string): string {
  // Read markdown file as string
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  return fileContents
}

export function getSortedPostsData() {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory)

  const nonNullPosts: PostMetadata[] = []
  fileNames.forEach((fileName) => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fileContents = readPost(id)

    // Use gray-matter to parse the post metadata section
    const { data } = parsePost(fileContents)

    if (data.date !== undefined && data.title !== undefined) {
      nonNullPosts.push({
        id: id,
        title: data.title,
        date: data.date,
      })
    }
  })

  // Sort posts by date
  return nonNullPosts.sort(({ date: a }, { date: b }) => {
    if (a < b) {
      return 1
    } else if (a > b) {
      return -1
    } else {
      return 0
    }
  })
}

export function getAllPostIds(): PostIdParams[] {
  const fileNames = fs.readdirSync(postsDirectory)

  // Returns an array that looks like this:
  // [
  //   {
  //     params: {
  //       id: 'ssg-ssr'
  //     }
  //   },
  //   {
  //     params: {
  //       id: 'pre-rendering'
  //     }
  //   }
  // ]
  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export async function getPostData(id: string): Promise<PostData> {
  const fileContents = readPost(id)

  // Use gray-matter to parse the post metadata section
  const { data, content } = parsePost(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(html)
    .process(content)
  const contentHtml = processedContent.toString()

  // Combine the data with the id and contentHtml
  return {
    id: id,
    date: (data.date !== undefined) ? data.date : "undefined",
    title: (data.title !== undefined) ? data.title : "undefined",
    contentHtml,
  }
}
