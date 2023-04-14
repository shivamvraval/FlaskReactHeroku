import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";

export const Header = () => {
  return (
    <Navbar bg="light" >
      <Container>
        <Navbar.Brand href="#home">Cluster Investigator</Navbar.Brand>
      </Container>
    </Navbar>
  );
};


