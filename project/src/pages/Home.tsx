import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import HeroImg from "../assets/images/heroo.png";
import {
  Wrench,
  Zap,
  Hammer,
  Sparkles,
  Package,
  Home as HomeIcon,
} from "lucide-react";

export function Home() {
  const { isAuthenticated } = useAuth();

  const services = [
    {
      name: "Plumbing",
      icon: Wrench,
      color: "blue",
      description: "Fix leaks, install fixtures",
    },
    {
      name: "Electrical",
      icon: Zap,
      color: "yellow",
      description: "Wiring, repairs, installations",
    },
    {
      name: "Carpentry",
      icon: Hammer,
      color: "orange",
      description: "Custom furniture, repairs",
    },
    {
      name: "Cleaning",
      icon: Sparkles,
      color: "green",
      description: "Deep cleaning services",
    },
    {
      name: "Appliance Repair",
      icon: Package,
      color: "red",
      description: "Fix home appliances",
    },
    {
      name: "Home Maintenance",
      icon: HomeIcon,
      color: "purple",
      description: "General home upkeep",
    },
  ];

  return (
    <Layout>
      <div className="animate-fade-in">
        <section className="w-full min-h-screen bg-purple-50 shadow-xl py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto px-4 md:px-10">
            {/* LEFT SIDE */}
            <div className="space-y-6">
              <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
                Find Trusted{" "}
                <span className="text-purple-600">Home Services</span>
                <br />
                Quickly & Easily
              </h1>

              <p className="text-lg text-gray-600">
                Book reliable professionals for plumbing, electrical work,
                cleaning, appliance repair, and more. Your home services
                solution—fast, trusted, and easy.
              </p>

              <div className="flex gap-4">
                {!isAuthenticated && (
                  <>
                    <a
                      href="#/register"
                      className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow hover:bg-purple-700 hover:scale-105 transition-all"
                    >
                      Get Started
                    </a>
                    <a
                      href="#/login"
                      className="px-8 py-3 bg-white border border-purple-300 text-purple-600 rounded-xl font-semibold shadow hover:bg-purple-50 hover:scale-105 transition-all"
                    >
                      Login
                    </a>
                  </>
                )}

                {isAuthenticated && (
                  <a
                    href="#/user/services"
                    className="px-8 py-3 bg-purple-600 text-white rounded-xl font-semibold shadow hover:bg-purple-700 hover:scale-105 transition-all"
                  >
                    Browse Services
                  </a>
                )}
              </div>
            </div>

            {/* RIGHT IMAGE SECTION */}
            <div className="relative flex justify-center">
              <img
                src={HeroImg}
                alt="LocalSewa Hero"
                className="w-80 md:w-96 drop-shadow-xl rounded-2xl"
              />

              {/* Floating Card 1 */}
              <div className="absolute top-6 right-0 bg-white px-4 py-2 rounded-xl shadow-lg">
                <p className="text-sm font-semibold text-gray-800">
                  50+ Services
                </p>
              </div>

              {/* Floating Card 2 */}
              <div className="absolute bottom-10 left-0 bg-white px-4 py-2 rounded-xl shadow-lg">
                <p className="text-sm font-semibold text-gray-800">
                  Verified Experts
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Our Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.name}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all transform hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-16 h-16 bg-${service.color}-100 rounded-full flex items-center justify-center mb-4`}
                  >
                    <Icon className={`w-8 h-8 text-${service.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Browse Services
              </h3>
              <p className="text-gray-600">
                Explore our wide range of home services
              </p>
            </div>
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Book Service
              </h3>
              <p className="text-gray-600">
                Choose a provider and schedule your service
              </p>
            </div>
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Get It Done
              </h3>
              <p className="text-gray-600">
                Professional service at your doorstep
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
