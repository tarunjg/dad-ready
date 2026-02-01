import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { docUrl } = req.body;

  if (!docUrl) {
    return res.status(400).json({ error: 'No document URL provided' });
  }

  // Extract document ID from URL
  const docIdMatch = docUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (!docIdMatch) {
    return res.status(400).json({ error: 'Invalid Google Docs URL' });
  }

  const docId = docIdMatch[1];

  try {
    // Fetch the document using the user's access token
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${docId}`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Docs API error:', error);
      return res.status(response.status).json({ 
        error: 'Failed to fetch document. Make sure the document is shared with your account.' 
      });
    }

    const doc = await response.json();
    
    // Extract text content from the document
    let textContent = '';
    
    if (doc.body && doc.body.content) {
      for (const element of doc.body.content) {
        if (element.paragraph && element.paragraph.elements) {
          for (const textElement of element.paragraph.elements) {
            if (textElement.textRun && textElement.textRun.content) {
              textContent += textElement.textRun.content;
            }
          }
        }
      }
    }

    return res.status(200).json({ 
      title: doc.title,
      content: textContent 
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
}
