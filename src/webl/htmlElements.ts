export class RHTMLClickButton {
    bOnClickSwitch = false;

    bInit = true;

    ElementInner: HTMLButtonElement | null = null;

    Name;

    constructor(inName: string) {
        this.Name = inName;
    }

    Update(document: Document) {
        this.ElementInner = document.querySelector(this.Name);
        if (this.ElementInner) {
            this.bInit = true;
            this.ElementInner.addEventListener("click", () => {
                this.bOnClickSwitch = true;
            });
        }
    }
}

export class RHTMLProgressElement {
    bInit = true;

    ElementInner: HTMLDivElement | null = null;

    Name;

    constructor(inName: string) {
        this.Name = inName;
    }
}
