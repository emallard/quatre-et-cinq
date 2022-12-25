module qec {


    export class runAll {
        private all: ((done: () => void) => void)[] = [];
        doneCount: number;

        push(f: (done: () => void) => void) {
            this.all.push(f);
        }

        run(done: () => void) {
            if (this.all.length == 0)
                done();

            this.doneCount = 0;
            for (var i = 0; i < this.all.length; ++i)
                this.all[i](() => this.onDone(done));
        }

        private onDone(done: () => void) {
            this.doneCount++;
            //console.log('runAll.onDone : ' + this.doneCount)
            if (this.doneCount == this.all.length)
                done();
        }
    }

}