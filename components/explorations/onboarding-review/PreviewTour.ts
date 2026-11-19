// The review owns its tour explicitly, preventing a second invitation inside shared UI.
export function useTour(){return {contextualTipsEnabled:false,acknowledgedTipIds:[] as string[],hasActiveBlocker:false,isTourRunning:false,acknowledgeTip:()=>{}};}
