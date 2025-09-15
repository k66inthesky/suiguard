/// SuiGuard Security Certificate System
/// Issues and manages security certificates for DeFi applications
module suiguard_certificate::certificate {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};
    use sui::event;

    /// Security Certificate NFT
    public struct SecurityCertificate has key, store {
        id: UID,
        recipient: address,
        application_name: String,
        domain: String,
        security_score: u8,          // 0-100 security score
        risk_level: String,          // LOW, MEDIUM, HIGH
        certification_date: u64,     // timestamp
        expiry_date: u64,            // timestamp
        analyzer_version: String,
        certificate_hash: String,
    }

    /// Certificate issued event
    public struct CertificateIssued has copy, drop {
        certificate_id: object::ID,
        recipient: address,
        application_name: String,
        security_score: u8,
        risk_level: String,
    }

    /// Issue a new security certificate
    public entry fun issue_certificate(
        recipient: address,
        application_name: vector<u8>,
        domain: vector<u8>,
        security_score: u8,
        risk_level: vector<u8>,
        analyzer_version: vector<u8>,
        certificate_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let expiry_time = current_time + (365 * 24 * 60 * 60 * 1000); // 1 year validity
        
        let certificate = SecurityCertificate {
            id: object::new(ctx),
            recipient,
            application_name: string::utf8(application_name),
            domain: string::utf8(domain),
            security_score,
            risk_level: string::utf8(risk_level),
            certification_date: current_time,
            expiry_date: expiry_time,
            analyzer_version: string::utf8(analyzer_version),
            certificate_hash: string::utf8(certificate_hash),
        };

        // Emit certificate issued event
        event::emit(CertificateIssued {
            certificate_id: object::id(&certificate),
            recipient,
            application_name: string::utf8(application_name),
            security_score,
            risk_level: string::utf8(risk_level),
        });

        transfer::public_transfer(certificate, recipient);
    }

    /// Get certificate details
    public fun get_certificate_info(cert: &SecurityCertificate): (String, String, u8, String, u64, u64) {
        (
            cert.application_name,
            cert.domain,
            cert.security_score,
            cert.risk_level,
            cert.certification_date,
            cert.expiry_date
        )
    }

    /// Check if certificate is still valid
    public fun is_valid(cert: &SecurityCertificate, clock: &Clock): bool {
        clock::timestamp_ms(clock) < cert.expiry_date
    }

    /// Revoke certificate (burn it)
    public entry fun revoke_certificate(cert: SecurityCertificate) {
        let SecurityCertificate { id, .. } = cert;
        object::delete(id);
    }
}
