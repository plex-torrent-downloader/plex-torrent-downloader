import bcrypt from 'bcrypt';

export default new class Bcrypt {
    private saltRounds = 10;

    async hashPassword(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(this.saltRounds);
            const hash = await bcrypt.hash(password, salt);
            return hash;
        } catch (err) {
            throw new Error(`Failed to hash password: ${err}`);
        }
    }

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            const result = await bcrypt.compare(password, hashedPassword);
            return result;
        } catch (err) {
            throw new Error(`Failed to compare password: ${err}`);
        }
    }
}
