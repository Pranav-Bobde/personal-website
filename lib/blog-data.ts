export interface BlogPost {
  id: string
  title: string
  date: string
  summary: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    id: "building-with-nextjs",
    title: "Building modern web applications with Next.js",
    date: "Mar 15, 2024",
    summary: "An exploration of Next.js features and best practices for building performant web applications.",
    content: `
Next.js has become the go-to framework for building modern web applications with React. Its combination of server-side rendering, static site generation, and client-side rendering makes it incredibly versatile.

Over the last few months, I've set out to really get my development workflow sorted and organized so I can build better applications. I have explored numerous frameworks, and "productivity setups", searching for that seamless integration that could bring a sense of order to my chaotic development process. But nothing quite hit the mark until I discovered Next.js.

This is not going to be one of those complex setups that you often see influencers making videos and courses about. I actually rejected several other frameworks because I found them really overwhelming after watching YouTube videos setting them up so extensively.

## What I wanted from my development framework

* **Performance**: Has to have excellent loading times and optimization
* **Developer Experience**: Should make coding enjoyable and productive
* **Flexibility**: Must handle various types of applications
* **Scalability**: Should grow with my projects without requiring rewrites

## Why Next.js works for me

Next.js provides a well-structured approach to building React applications. Here are some key features that make it stand out:

* **File-based routing**: Creating new pages is as simple as adding files to the pages directory
* **API Routes**: Building backend functionality alongside your frontend
* **Image Optimization**: Automatic image optimization for better performance
* **Incremental Static Regeneration**: Update static content without rebuilding the entire site

The framework's flexibility allows me to choose the rendering method that best suits each page of my application. This means I can optimize for performance where needed and for dynamic content elsewhere.

## Getting started with Next.js

If you're interested in trying Next.js, here's a simple way to get started:

\`\`\`bash
npx create-next-app@latest my-next-app
cd my-next-app
npm run dev
\`\`\`

This will create a new Next.js application and start the development server. You can then open http://localhost:3000 to see your application in action.

Next.js has transformed how I build web applications, making the process more enjoyable and the results more impressive. If you haven't tried it yet, I highly recommend giving it a go.
    `,
  },
  {
    id: "typescript-tips",
    title: "Advanced TypeScript tips for better code quality",
    date: "Feb 28, 2024",
    summary: "Improve your TypeScript skills with these advanced tips and tricks.",
    content: `
TypeScript has become an essential tool for JavaScript developers who want to write more maintainable and error-free code. While the basics are easy to pick up, there are many advanced features that can take your TypeScript skills to the next level.

Over the last few months, I've set out to really get my TypeScript knowledge sorted and organized so I can write better code. I have explored numerous techniques and "productivity setups", searching for that seamless integration that could bring a sense of order to my chaotic coding style. But nothing quite hit the mark until I discovered these advanced TypeScript features.

## Utility Types

TypeScript comes with several built-in utility types that can help you transform existing types in useful ways:

* **Partial<T>**: Makes all properties of T optional
* **Required<T>**: Makes all properties of T required
* **Pick<T, K>**: Creates a type with only the properties K from T
* **Omit<T, K>**: Creates a type without the properties K from T

## Discriminated Unions

Discriminated unions are a powerful pattern in TypeScript that allows you to create types that can be one of several different shapes, but with a common property that lets TypeScript know which shape it is:

\`\`\`typescript
type Circle = {
  kind: 'circle';
  radius: number;
};

type Square = {
  kind: 'square';
  sideLength: number;
};

type Shape = Circle | Square;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'square':
      return shape.sideLength ** 2;
  }
}
\`\`\`

## Mapped Types

Mapped types allow you to create new types based on old ones by transforming properties:

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Person = {
  name: string;
  age: number;
};

type ReadonlyPerson = Readonly<Person>;
\`\`\`

## Conditional Types

Conditional types allow you to create types that depend on a condition:

\`\`\`typescript
type NonNullable<T> = T extends null | undefined ? never : T;
\`\`\`

These advanced TypeScript features have transformed how I write code, making the process more enjoyable and the results more robust. If you haven't explored these features yet, I highly recommend giving them a try.
    `,
  },
  {
    id: "tailwind-vs-css",
    title: "Tailwind CSS vs. traditional CSS: A comparison",
    date: "Jan 10, 2024",
    summary: "Comparing the pros and cons of using Tailwind CSS versus traditional CSS approaches.",
    content: `
The debate between Tailwind CSS and traditional CSS approaches has been ongoing in the web development community. Both have their strengths and weaknesses, and choosing between them often comes down to personal preference and project requirements.

Over the last few months, I've set out to really get my styling workflow sorted and organized. I have explored numerous CSS frameworks and "productivity setups", searching for that seamless integration that could bring a sense of order to my chaotic styling process. But nothing quite hit the mark until I tried both approaches in depth.

## Traditional CSS Approaches

Traditional CSS approaches include:

* **Plain CSS**: Writing CSS from scratch
* **SASS/SCSS**: Using preprocessors for variables, nesting, and mixins
* **CSS Modules**: Scoping CSS to specific components
* **CSS-in-JS**: Libraries like styled-components or emotion

### Pros of Traditional CSS

* **Separation of concerns**: Keeps HTML and CSS separate
* **Reusability**: Easy to reuse styles across different elements
* **Maintainability**: Changes to styles don't require changes to HTML
* **Performance**: Can be optimized for smaller file sizes

### Cons of Traditional CSS

* **Global namespace**: Can lead to naming conflicts
* **Specificity issues**: Can be difficult to override styles
* **Context switching**: Need to switch between HTML and CSS files

## Tailwind CSS

Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs.

### Pros of Tailwind CSS

* **Development speed**: Faster to build UIs without writing custom CSS
* **Consistency**: Predefined design system with spacing, colors, etc.
* **Responsive design**: Built-in responsive utilities
* **No naming**: No need to come up with class names

### Cons of Tailwind CSS

* **HTML bloat**: Can lead to long class lists in HTML
* **Learning curve**: Need to learn Tailwind's utility classes
* **Customization**: May require configuration for custom designs

## My Preference

After using both approaches extensively, I've found that Tailwind CSS works better for me in most cases. The development speed and consistency it provides outweigh the downsides. However, I still use traditional CSS for certain projects where it makes more sense.

The key is to understand the strengths and weaknesses of each approach and choose the one that best fits your project and team. There's no one-size-fits-all solution in web development, and being flexible in your approach will serve you well in the long run.
    `,
  },
  {
    id: "react-server-components",
    title: "Understanding React Server Components",
    date: "Dec 5, 2023",
    summary: "A deep dive into React Server Components and how they change the way we build React applications.",
    content: `
React Server Components represent a paradigm shift in how we build React applications. They allow components to render on the server, reducing the amount of JavaScript sent to the client and improving performance.

Over the last few months, I've set out to really get my React knowledge sorted and organized. I have explored numerous patterns and "productivity setups", searching for that seamless integration that could bring a sense of order to my chaotic development process. But nothing quite hit the mark until I discovered React Server Components.

## What are React Server Components?

React Server Components are a new kind of component that runs only on the server. They can:

* **Access server-side resources directly**: Databases, file systems, etc.
* **Reduce bundle size**: Server components aren't included in the JavaScript bundle sent to the client
* **Automatic code splitting**: Only the necessary client components are sent to the browser

## How do they work?

React Server Components work by splitting your application into two parts:

1. **Server Components**: Run on the server and can access server-side resources
2. **Client Components**: Run on the client and can be interactive

Here's a simple example:

\`\`\`jsx
// Server Component
async function BlogPost({ id }) {
  const post = await db.query(\`SELECT * FROM posts WHERE id = \${id}\`);
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <LikeButton id={post.id} likes={post.likes} />
    </div>
  );
}

// Client Component
'use client';
function LikeButton({ id, likes }) {
  const [count, setCount] = useState(likes);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Like ({count})
    </button>
  );
}
\`\`\`

## Benefits of React Server Components

* **Improved performance**: Less JavaScript sent to the client
* **Better user experience**: Faster initial load times
* **Simplified data fetching**: No need for client-side data fetching libraries
* **Reduced waterfall requests**: Data can be fetched in parallel on the server

## Challenges and Considerations

* **Mental model**: Requires a shift in how we think about React components
* **Tooling**: Still evolving and may require specific setups
* **Compatibility**: Not all libraries are compatible with Server Components

React Server Components have transformed how I build web applications, making the process more enjoyable and the results more impressive. If you haven't tried them yet, I highly recommend giving them a go, especially with frameworks like Next.js that have built-in support for them.
    `,
  },
]

