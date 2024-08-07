import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";

const formData: FormData = new FormData();

const apiBase = (token: string) =>
  axios.create({
    baseURL: "https://graph.facebook.com/v19.0/",
    params: {
      access_token: token
    }
  });

export const getAccessToken = async (): Promise<string> => {
  const { data } = await axios.get(
    "https://graph.facebook.com/v19.0/oauth/access_token",
    {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        grant_type: "client_credentials"
      }
    }
  );

  return data.access_token;
};

export const markSeen = async (id: string, token: string): Promise<void> => {
  await apiBase(token).post(`${id}/messages`, {
    recipient: {
      id
    },
    sender_action: "mark_seen"
  });
};

export const sendText = async (
  id: string | number,
  text: string,
  token: string
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id
      },
      message: {
        text: `${text}`
      }
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendAttachmentFromUrl = async (
  id: string,
  url: string,
  type: string,
  token: string
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id
      },
      message: {
        attachment: {
          type: type,
          payload: {
            url
          }
        }
      }
    });

    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendAttachment = async (
  id: string,
  file: Express.Multer.File,
  type: string,
  token: string
): Promise<void> => {
  formData.append(
    "recipient",
    JSON.stringify({
      id
    })
  );

  formData.append(
    "message",
    JSON.stringify({
      attachment: {
        type: type,
        payload: {
          is_reusable: true
        }
      }
    })
  );

  let fileReaderStream = createReadStream(file.path);

  formData.append("filedata", fileReaderStream);

  try {
    await apiBase(token).post("me/messages", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
  } catch (error) {
    throw new AppError(error);
  }
};

export const genText = (text: string): any => {
  const response = {
    text
  };

  return response;
};

export const getProfile = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(id);
    return {
      first_name: data.name,
      last_name: data.username,
      profile_pic: data.profile_pic,
      id: id
    }
    //return data;
  } catch (error) {
    //console.log("ERR_FETCHING_FB_USER_PROFILE_2: ", error.response.data)
    //console.log("🚀 ~ getProfile ~ error.response.data.code:", error.response.data.error.code)
    if (error.response.data.error.code === 100) {
      return {
        first_name: 'User',
        last_name: id,
        profile_pic: 'https://scontent-mia3-1.xx.fbcdn.net/v/t1.30497-1/84628273_176159830277856_972693363922829312_n.jpg?stp=dst-jpg_p720x720&_nc_cat=1&ccb=1-7&_nc_sid=5f2048&_nc_eui2=AeGCyXSCc5awsKs6Kgi54aeBik--Qfnh2B6KT75B-eHYHphyokTIZXcO5JQyC-dZLmlHWtjDN0GfFFpd-kHJOwCC&_nc_ohc=WYIZztD2FIcQ7kNvgHWJQeV&_nc_ht=scontent-mia3-1.xx&edm=AP4hL3IEAAAA&oh=00_AYA6nsjmgMF1JXMQHDk-HJDVngh6r-B3TlGIKq8LIlCR1A&oe=66927E59',
        id: id
      }
    }
    console.log(id)
    throw new AppError("ERR_FETCHING_FB_USER_PROFILE_2");
  }
};

export const getPageProfile = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(
      `${id}/accounts?fields=name,access_token,instagram_business_account{id,username,profile_picture_url,name}`
    );
    return data;
  } catch (error) {
    //console.log(error);
    console.log("🚀 ~ error:", error)
    throw new AppError("ERR_FETCHING_FB_PAGES");
  }
};

export const profilePsid = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/v19.0/${id}?access_token=${token}`
    );
    /* return {
      first_name: data.name,
      last_name: data.username,
      profile_pic: data.profile_pic,
      id: id
    } */
    return data;
  } catch (error) {
    console.log("ERR_FETCHING_FB_USER_PROFILE_1: ", error.response.data)
    return await getProfile(id, token);
  }
};

export const subscribeApp = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/v19.0/${id}/subscribed_apps?access_token=${token}`,
      {
        subscribed_fields: [
          "messages",
          "messaging_postbacks",
          "messaging_optins",
          "message_deliveries",
          "message_reads",
          "messaging_payments",
          "messaging_pre_checkouts",
          "messaging_checkout_updates",
          "messaging_account_linking",
          "messaging_referrals",
          "message_echoes",
          "messaging_game_plays",
          "standby",
          "messaging_handovers",
          "messaging_policy_enforcement",
          "message_reactions"
        ]
      }
    );
    return data;
  } catch (error) {
    throw new AppError("ERR_SUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};

export const unsubscribeApp = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await axios.delete(
      `https://graph.facebook.com/v19.0/${id}/subscribed_apps?access_token=${token}`
    );
    return data;
  } catch (error) {
    throw new AppError("ERR_UNSUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};

export const getSubscribedApps = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(`${id}/subscribed_apps`);
    return data;
  } catch (error) {
    throw new AppError("ERR_GETTING_SUBSCRIBED_APPS");
  }
};

export const getAccessTokenFromPage = async (
  token: string
): Promise<string> => {
  try {
    const data = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          grant_type: "fb_exchange_token",
          fb_exchange_token: token
        }
      }
    );

    return data.data.access_token;
  } catch (error) {
    console.log(error);
    throw new AppError("ERR_FETCHING_FB_USER_TOKEN");
  }
};

export const removeApplcation = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    const { data } = await axios.delete(
      `https://graph.facebook.com/v19.0/${id}/permissions`,
      {
        params: {
          access_token: token
        }
      }
    );
  } catch (error) {
    logger.error("ERR_REMOVING_APP_FROM_PAGE");
  }
};
