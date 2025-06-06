import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import java.util.Base64;
//
//public class GenerateKey {
//    public static void main(String[] args) {
//        SecretKey key = Keys.secretKeyFor(io.jsonwebtoken.SignatureAlgorithm.HS512);
//        String base64Key = Base64.getEncoder().encodeToString(key.getEncoded());
//        System.out.println("Nova chave secreta (Base64): " + base64Key);
//    }
//}