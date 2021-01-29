/**
 * defintions:
 * 
 * frame(s): any independent container; parent and iframes are frames
 * 
 */



//=============================
window.addEventListener('load', () => {



    let iframes = {
        host: {
            document,
            window
        },

    };

    let iframesWindow = new Map();


    iframesWindow.set(window, {
        id: 'host',
        document,
        window,
    })


    window.iframes = iframes;


    let allFrames = document.getElementsByTagName('iframe')

    let i = 1;
    for (let frame of allFrames) {
        let id = frame.id || `iframe${i++}`
        iframes[id] = ({
            frame,
            document: frame.contentDocument || frame.contentWindow.document,
            window: frame.contentWindow
        })
        iframesWindow.set(frame.contentWindow, {
            id,
            window: frame.contentWindow,
            document: frame.contentDocument || frame.contentWindow.document,
            frame
        })

        frame.contentWindow.iframes = iframes;
    }

    const mutationCallback = function(mutationsList, observer) {

        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (let added of mutation.addedNodes) {
                    if (added.tagName === 'IFRAME') {
                        let id = added.id || `iframe${i++}`
                        iframes.guests[id] = ({
                            frame: added,
                            document: added.contentDocument,
                            window: added.contentWindow
                        })
                        added.contentWindow.iframes = iframes;
                    }
                }
            }

        }
    };

    const observer = new MutationObserver(mutationCallback);

    const config = { attributes: true, childList: true, subtree: true };

    observer.observe(document.body, config);



    /**
     * register a listener on new messages from other frames
     * 
     * @param {function} [callback] a function that will be called upon new message
     *      this callback will be given the sender and data as two distict parameters 
     * @returns nothing
     */
    const listenerMapId = new Map();
    const listenerMapWindow = new Map();
    const listeners = [];

    const registerListener = function(callback) {

        let frameObject = iframesWindow.get(this)

        if (!frameObject)
            console.error('CoCreate-communication: can not register new listener')


        listeners.push({
            frameObject,
            callback
        })

        if (!listenerMapWindow.get(this))
            listenerMapWindow.set(this, []);

        if (!listenerMapId.get(this))
            listenerMapId.set(this, []);


        listenerMapWindow.get(this).push({
            frameObject,
            callback
        });

        listenerMapId.get(frameObject.id).push({
            frameObject,
            callback
        });

        // for (const frameName in allFrames) {
        //     if (allFrames.hasOwnProperty(frameName)) {
        //         const frame = allFrames[frameName];
        //         if (frame.window === this)
        //             listeners.push({
        //                 id: frameName,
        //                 callback
        //             })
        //     }
        // }
    }

    /**
     * send message to other listeners
     *  
     * @param {any} [send] a variable which is send to other frames and host   
     * @param {string|array[string]} [sender=all]  send to these messages
     * 
     * @returns {number} the counts of all sent messages
     */
    const sendMessage = function(data, sender = 'all') {
        let callCount = 0;

        if (sender === 'all')
            listenerMapId.forEach((listeners, id) => {
                listeners.forEach(listener => {
                    callCount++;
                    listener.callback.apply(listener.frameObject.window, [data, listener.frameObject])
                })
            })

        else if (typeof sender === 'string') {
            
            let listeners = listenerMapId.get(sender);
            listeners.forEach(listener => {
                    callCount++;
                    listener.callback.apply(listener.frameObject.window, [data, listener.frameObject])
            })
        }
        else if (Array.isArray(sender)) {
            listeners.forEach(listener => {
                let { id } = listener.frameObject;
                if (sender.includes(id)) {
                    callCount++;
                    listener.callback.apply(listener.frameObject.window, [data, listener.frameObject])
                }
            })
        }

        else
            console.error('CoCreate-communication: sender parameter must be either string or array')

        return callCount;

    }


    //=============================

    // example
    // registerListener((data, frameObject) => {
    //     // we can check sender 
    //     let {sender, window, document} =  frameObject;
    //     switch(sender)
    //     {
    //         case "client2":
    //          // only for client2 frame
    //         break;
    //         default:
    //         // for every other frames

    //     }

    // })


    // sendMessage({ someData: 111})
    // sendMessage({ someData: 111}, 'client2')
    // sendMessage({ someData: 111}, [ 'client2', 'client3'])


    // always loaded in host no iframes




})

with('allframes',(document, window)=>{
    // every thing happen here is like doing in one frame but all iframes and parent will be in use 
    document.getElementById('id') // id will be looked up on all iframes and parent
    initDnd(document) // all document(iframes and parent) will be initiated by dnd 
    window.aaa = 33; // this will be accessible by all iframes and parent using window.aaa
    
    
    
})

// another example using only arbiterary selected frames
with(['parent', 'iframe1', 'iframe2'],(document, window)=>{
document.addEventListener('load') // listen for all iframes load
})
