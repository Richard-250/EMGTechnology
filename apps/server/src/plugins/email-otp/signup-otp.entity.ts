import { DeepPartial, VendureEntity } from '@vendure/core';
import { Column, Entity } from 'typeorm';

@Entity()
export class SignupOtp extends VendureEntity {
    constructor(input?: DeepPartial<SignupOtp>) {
        super(input);
    }

    @Column({ unique: true })
    email: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    code: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ default: false })
    verified: boolean;
}
