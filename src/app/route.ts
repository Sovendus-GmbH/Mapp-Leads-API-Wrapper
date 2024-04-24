import { NextRequest, NextResponse } from "next/server";

const apiContactsPath = "/api/rest/v19/contact/create";
const apiSubscribePath = "/api/rest/v19/membership/subscribeByEmail";

export interface MappPostRequest {
  firstname: string;
  lastname: string;
  email: string;
  countryCode: string;
  listId: string;
  subscriptionMode: "FORCE_OPT_IN" | "DOUBLE_OPT_IN";
  // DOUBLE_OPT_IN
  //  New contacts receive an invitation to join the group via email. The contact must accept the invitation before they are added to the group.
  // FORCE_OPT_IN
  //  New contacts are added to the group with a notification if the system supports it / its enabled.
  mappUsername: string;
  mappPassword: string;
  mappDomain: string;
  mappCustomAttributes: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const {
    firstname,
    lastname,
    email,
    countryCode,
    listId,
    subscriptionMode,
    mappUsername,
    mappPassword,
    mappDomain,
    mappCustomAttributes,
  }: MappPostRequest = await request.json();
  const apiKey = request.headers.get("apiKey");
  if (apiKey !== process.env.API_KEY) {
    return ApiResponse("The API Key for this wrapper API is wrong", 403);
  }
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${btoa(`${mappUsername}:${mappPassword}`)}`,
  };
  try {
    const response = await createMappContact({
      mappCustomAttributes,
      email,
      firstname,
      lastname,
      countryCode,
      mappDomain,
      headers,
    });
    if (response.ok) {
      const subscribeResponse = await subscribeMappContact({
        mappDomain,
        email,
        listId,
        subscriptionMode,
        headers,
      });
      if (subscribeResponse.ok) {
        return ApiResponse("Contact successfully added and subscribed!", 200);
      }
      return ApiResponse(
        `The contact was added to mapp, but subscribing to the list was not successful via the mapp api. Error: ${JSON.stringify(
          await subscribeResponse.json()
        )} ${formatApiCallDetails({
          firstname,
          lastname,
          email,
          countryCode,
          listId,
        })}`,
        500
      );
    }
    return ApiResponse(
      `Failed to update the contact via the mapp api. Error: ${JSON.stringify(
        await response.json()
      )} ${formatApiCallDetails({
        firstname,
        lastname,
        email,
        countryCode,
        listId,
      })}`,
      500
    );
  } catch (error) {
    return ApiResponse(
      `Failed to add the contact via the mapp api with an unknown error. Error: ${error} ${formatApiCallDetails(
        { firstname, lastname, email, countryCode, listId }
      )}`,
      500
    );
  }
}

async function createMappContact({
  mappCustomAttributes,
  email,
  firstname,
  lastname,
  countryCode,
  mappDomain,
  headers,
}: {
  mappCustomAttributes: string;
  email: string;
  firstname: string;
  lastname: string;
  countryCode: string;
  mappDomain: string;
  headers: {
    Accept: string;
    "Content-Type": string;
    Authorization: string;
  };
}): Promise<Response> {
  const rawAttributes =
    mappCustomAttributes &&
    mappCustomAttributes?.replace(/, /g, ",").split(",");
  let attributes: { name: string; value: string }[] = [];
  if (rawAttributes) {
    attributes = rawAttributes.map((rawAttribute) => {
      const [attributeName, attributeValue] = rawAttribute.split("=");
      return { name: attributeName, value: attributeValue };
    });
  }
  const contactPayload = {
    emailAddress: email,
    attributes: [
      { name: "FirstName", value: firstname },
      { name: "LastName", value: lastname },
      { name: "user.ISOCountryCode", value: countryCode },
      ...attributes,
    ],
  };
  const response: Response = await fetch(
    `https://${mappDomain}${apiContactsPath}`,
    {
      method: "post",
      headers,
      body: JSON.stringify(contactPayload),
    }
  );
  return response;
}

async function subscribeMappContact({
  mappDomain,
  email,
  listId,
  subscriptionMode,
  headers,
}: {
  mappDomain: string;
  email: string;
  listId: string;
  subscriptionMode: string;
  headers: {
    Accept: string;
    "Content-Type": string;
    Authorization: string;
  };
}): Promise<Response> {
  const subscribeResponse: Response = await fetch(
    `https://${mappDomain}${apiSubscribePath}?email=${email}&groupId=${parseInt(
      String(listId),
      10
    )}&subscriptionMode=${
      subscriptionMode === "FORCE_OPT_IN"
        ? "CONFIRMED_OPT_IN"
        : subscriptionMode
    }`,
    {
      method: "post",
      headers,
    }
  );
  return subscribeResponse;
}

export function ApiResponse(
  message: string,
  status: number = 200
): NextResponse {
  return new NextResponse(message, {
    status,
  });
}

export function formatApiCallDetails(fields: {
  [key: string]: string | undefined;
}): string {
  const data = (Object.entries(fields) as [string, string][])
    .filter(([, value]) => value)
    .map(([name, value]) => ` ${name}: ${value}`);
  return `- Contact:${data}`;
}
