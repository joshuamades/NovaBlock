let pendingAudio = false;
let loadComplete = false;

export function Base64Manager (scene, onCompleteCallback)
{
    pendingAudio = false;
    loadComplete = false;

    scene.load.on('complete', () => {

        loadComplete = true;

        if (!pendingAudio)
        {
            onCompleteCallback();
        }

    });

    scene.sound.once('decodedall', () => {

        pendingAudio = false;

        if (loadComplete)
        {
            onCompleteCallback();
        }

    });
}

export function IsPendiungAudio ()
{
    return pendingAudio;
}

export function IsLoadComplete ()
{
    return loadComplete;
}

export function SetLoadComplete ()
{
    loadComplete = true;
}

export function SetPendingAudio ()
{
    pendingAudio = true;
}
