export function DecodeString (data, asJSON = false)
{
    // Remove the prefix
    const base64String = data.split(',')[1];

    const decodedString = atob(base64String);

    if (asJSON)
    {
        // Parse the JSON string back into an object
        return JSON.parse(decodedString);
    }
    else
    {
        return decodedString;
    }
}
