module qec {
    export class editor_menu {
        root: HTMLDivElement;

        constructor() {
            this.root = document.createElement('div');
            this.root.innerHTML = `
            
            
            <div style="display:fixed;width:100%;height:50px;background-color:black">
                <div style="display:inline;color:white">
                    LOGO
                </div>
                <div style="display:inline">
                    <button class='open'>Open</button>
                </div>
                <div style="display:inline">
                    <button class='open'>Save</button>
                </div>
                <div style="display:inline">
                    <button class='open'>Update</button>
                </div>
            </div>
            `;
        }
    }
}