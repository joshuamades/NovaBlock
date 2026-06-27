import { SetPendingAudio } from "./Base64Manager";

function IsBase64 (str)
{
    return /^data:([a-zA-Z0-9-]+\/[a-zA-Z0-9-+.]+)?;base64,/.test(str);
}

export function LoadBase64Audio (scene, audioFiles)
{
    //  Get the first audio file in the list
    const file = audioFiles[0];

    if (IsBase64(file.data))
    {
        SetPendingAudio();

        //  For debugging - uncomment this:
        
        // this.sound.on('decoded', (key) => {
        //     console.log('Audio decoded:', key);
        // });

        scene.sound.decodeAudio(audioFiles);
    }
    else
    {
        audioFiles.forEach(file => {
            scene.load.audio(file.key, file.data);
        });
    }
}
