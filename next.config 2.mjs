/**
 * Next.js configuration
 *
 * This project uses the experimental server actions and edge runtime.  You can
 * adjust these values to suit your deployment needs.  See
 * https://nextjs.org/docs for more information.
 */
export default {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' }
  }
  , env: {
    // Expose OpenAI configuration to the runtime.  These values will be
    // populated from `.env.local` at build time and available via
    // process.env in server and client code (though you should not
    // expose the API key on the client).
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  }
};