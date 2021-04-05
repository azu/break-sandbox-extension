export type ScrollMessage = {
    parent: boolean;
    type: "scroll";
    toUrl: string;
    selector: string;
};
export type ConnectionMessage = ScrollMessage;
