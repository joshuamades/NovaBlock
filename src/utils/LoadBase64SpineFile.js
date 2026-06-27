import { DecodeString } from './DecodeString';

export function LoadBase64SpineFile (scene, spineData)
{
    let { key, json, atlas, png, preMultipliedAlpha } = spineData;

    scene.cache.json.add(key, DecodeString(json, true));
    
    if (!Array.isArray(png))
    {
        png = [ png ];
    }

    const atlasData = DecodeString(atlas);

    const textures = [];

    const content = atlasData.split(/\r?\n/);

    textures.push(content[0]);

    for (let t = 0; t < content.length; t++)
    {
        let line = content[t];

        if (line.trim() === '' && t < content.length - 1)
        {
            line = content[t + 1];

            textures.push(line);
        }
    }

    png.forEach(entry => {

        if (!scene.textures.exists(entry.key) && textures.indexOf(entry.key) !== -1)
        {
            scene.load.image(entry.key, entry.file);
        }
        else
        {
            console.warn('Missing Spine Texture:', entry.key);
        }

    });

    scene.cache.custom.spine.add(key, {
        preMultipliedAlpha,
        data: atlasData,
        prefix: ''
    });
}
