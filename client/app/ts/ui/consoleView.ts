module qec {

    export class consoleView {

        allText = ko.observable<string>();
        logCount = 0;
        text = ko.observable<string>("LOGLOGLOG");

        log(log: string) {
            var d = new Date();
            var s = d.getHours() + ":"
                + d.getMinutes() + ":"
                + d.getSeconds();
            this.allText(this.allText() + "<br/>\n" + s + " : " + log);
            this.logCount++;

            if (this.logCount > 3) {
                var cutIndex = this.allText().indexOf('\n');
                this.allText(this.allText().substr(cutIndex + 1));
                this.logCount--;
            }
            this.text("" + s + " : " + log);
        }
    }
}