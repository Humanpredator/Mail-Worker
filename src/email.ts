import { extract as parseRawEmail } from 'letterparser';
import { v4 as uuidv4 } from 'uuid';


export async function email(message: any, env: any, ctx?: any): Promise<void> {
  const url = env.API_URL;
  const server_key = env.SERVER_KEY;
  const forward_email = env.FORWARD_EMAIL;
  
  if (!server_key) throw new Error('Missing AUTH_TOKEN');

  try {
    const rawEmail = (await new Response(message.raw).text()).replace(/utf-8/gi, 'utf-8');
    const emailData = parseRawEmail(rawEmail);
    
    // Generate a unique identifier using uuidv4
    const uniqueId = uuidv4();
    
    if (message.to !== env.INC_ADDRESS) {
      await message.setReject("Address not allowed");
      throw new Error('Invalid email address.');
    } else {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Server-Key': `${server_key}`,
        },
        body: JSON.stringify({ mail_data:emailData,mail_id:uniqueId }),
      });
      if (!response.ok) { 
        await message.forward(forward_email);
        throw new Error('Api Server Error' + (await response.text()));
      } 
    }
  } catch (error: any) {
    console.error("Something Went Wrong", error.stack);
    await message.forward(forward_email);
    throw new Error(error.message);
  }
}
