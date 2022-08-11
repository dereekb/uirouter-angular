/**
 * Merge two injectors
 *
 * This class implements the Injector ng2 interface but delegates
 * to the Injectors provided in the constructor.
 */
export class MergeInjector {
    constructor(...injectors) {
        if (injectors.length < 2)
            throw new Error('pass at least two injectors');
        this.injectors = injectors;
    }
    /**
     * Get the token from the first injector which contains it.
     *
     * Delegates to the first Injector.get().
     * If not found, then delegates to the second Injector (and so forth).
     * If no Injector contains the token, return the `notFoundValue`, or throw.
     *
     * @param token the DI token
     * @param notFoundValue the value to return if none of the Injectors contains the token.
     * @returns {any} the DI value
     */
    get(token, notFoundValue) {
        for (let i = 0; i < this.injectors.length; i++) {
            const val = this.injectors[i].get(token, MergeInjector.NOT_FOUND);
            if (val !== MergeInjector.NOT_FOUND)
                return val;
        }
        if (arguments.length >= 2)
            return notFoundValue;
        // This will throw the DI Injector error
        this.injectors[0].get(token);
    }
}
MergeInjector.NOT_FOUND = {};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VJbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tZXJnZUluamVjdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBOzs7OztHQUtHO0FBQ0gsTUFBTSxPQUFPLGFBQWE7SUFHeEIsWUFBWSxHQUFHLFNBQXFCO1FBQ2xDLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ3pFLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsR0FBRyxDQUFDLEtBQVUsRUFBRSxhQUFtQjtRQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRSxJQUFJLEdBQUcsS0FBSyxhQUFhLENBQUMsU0FBUztnQkFBRSxPQUFPLEdBQUcsQ0FBQztTQUNqRDtRQUVELElBQUksU0FBUyxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQUUsT0FBTyxhQUFhLENBQUM7UUFFaEQsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9CLENBQUM7O0FBNUJNLHVCQUFTLEdBQUcsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0b3IgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuLyoqXG4gKiBNZXJnZSB0d28gaW5qZWN0b3JzXG4gKlxuICogVGhpcyBjbGFzcyBpbXBsZW1lbnRzIHRoZSBJbmplY3RvciBuZzIgaW50ZXJmYWNlIGJ1dCBkZWxlZ2F0ZXNcbiAqIHRvIHRoZSBJbmplY3RvcnMgcHJvdmlkZWQgaW4gdGhlIGNvbnN0cnVjdG9yLlxuICovXG5leHBvcnQgY2xhc3MgTWVyZ2VJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgc3RhdGljIE5PVF9GT1VORCA9IHt9O1xuICBwcml2YXRlIGluamVjdG9yczogSW5qZWN0b3JbXTtcbiAgY29uc3RydWN0b3IoLi4uaW5qZWN0b3JzOiBJbmplY3RvcltdKSB7XG4gICAgaWYgKGluamVjdG9ycy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoJ3Bhc3MgYXQgbGVhc3QgdHdvIGluamVjdG9ycycpO1xuICAgIHRoaXMuaW5qZWN0b3JzID0gaW5qZWN0b3JzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdG9rZW4gZnJvbSB0aGUgZmlyc3QgaW5qZWN0b3Igd2hpY2ggY29udGFpbnMgaXQuXG4gICAqXG4gICAqIERlbGVnYXRlcyB0byB0aGUgZmlyc3QgSW5qZWN0b3IuZ2V0KCkuXG4gICAqIElmIG5vdCBmb3VuZCwgdGhlbiBkZWxlZ2F0ZXMgdG8gdGhlIHNlY29uZCBJbmplY3RvciAoYW5kIHNvIGZvcnRoKS5cbiAgICogSWYgbm8gSW5qZWN0b3IgY29udGFpbnMgdGhlIHRva2VuLCByZXR1cm4gdGhlIGBub3RGb3VuZFZhbHVlYCwgb3IgdGhyb3cuXG4gICAqXG4gICAqIEBwYXJhbSB0b2tlbiB0aGUgREkgdG9rZW5cbiAgICogQHBhcmFtIG5vdEZvdW5kVmFsdWUgdGhlIHZhbHVlIHRvIHJldHVybiBpZiBub25lIG9mIHRoZSBJbmplY3RvcnMgY29udGFpbnMgdGhlIHRva2VuLlxuICAgKiBAcmV0dXJucyB7YW55fSB0aGUgREkgdmFsdWVcbiAgICovXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaW5qZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCB2YWwgPSB0aGlzLmluamVjdG9yc1tpXS5nZXQodG9rZW4sIE1lcmdlSW5qZWN0b3IuTk9UX0ZPVU5EKTtcbiAgICAgIGlmICh2YWwgIT09IE1lcmdlSW5qZWN0b3IuTk9UX0ZPVU5EKSByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDIpIHJldHVybiBub3RGb3VuZFZhbHVlO1xuXG4gICAgLy8gVGhpcyB3aWxsIHRocm93IHRoZSBESSBJbmplY3RvciBlcnJvclxuICAgIHRoaXMuaW5qZWN0b3JzWzBdLmdldCh0b2tlbik7XG4gIH1cbn1cbiJdfQ==